# backend/events/test_payment_security.py
"""
Payment and ticket security: account takeover of guest tickets, refunds and disputes, duplicate and
replayed webhooks, stored card data, references and what the gate team can see. Paystack is mocked.
"""
import hashlib
import hmac
import json
import threading
import unittest
from datetime import timedelta
from decimal import Decimal
from unittest import mock

from django.core import mail
from django.core.cache import cache
from django.db import connection
from django.test import TransactionTestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.models import User

from .models import Event, EventRegistration, TicketPayment, TicketType
from .test_ticketing import PAYSTACK_KEY, fake_initialize, paystack_verified
from .ticketing import settle_payment

Attention = TicketPayment.Attention

SECURE = dict(
    PAYSTACK_SECRET_KEY=PAYSTACK_KEY,
    FRONTEND_URL='https://front.test',
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    ADMINS=[('NACOS Admin', 'admin@nacos.test')],
)


def signed_webhook(client, payload: dict):
    body = json.dumps(payload).encode()
    signature = hmac.new(PAYSTACK_KEY.encode(), body, hashlib.sha512).hexdigest()
    client.force_authenticate(user=None)
    return client.post(reverse('paystack-webhook'), body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=signature)


@override_settings(**SECURE)
@mock.patch('events.ticketing.initialize_payment', side_effect=fake_initialize)
class PaymentSecurityTest(APITestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.staff = User.objects.create_user(email='staff@example.com', full_name='Staff', password='pass12345', role='admin')
        self.event = Event.objects.create(
            title='Movie Night', start_time=timezone.now() + timedelta(days=3), location='Hall', audience=Event.Audience.PUBLIC,
        )
        self.vip = TicketType.objects.create(event=self.event, name='VIP', price=Decimal('2500'))

    def guest_buy(self, email='ada@example.com'):
        self.client.force_authenticate(user=None)
        return self.client.post(reverse('events-register', kwargs={'pk': self.event.pk}),
                                {'name': 'Ada Guest', 'email': email, 'ticket_type': self.vip.pk}, format='json').data

    def pay(self, reference, amount=250_000, **extra):
        with mock.patch('events.ticketing.verify_payment', return_value={**paystack_verified(amount=amount), **extra}):
            with self.captureOnCommitCallbacks(execute=True):
                return settle_payment(reference)

    # ── #1 account takeover of a guest ticket ────────────────────────────────

    def test_unverified_account_with_a_guests_email_cannot_see_or_take_the_ticket(self, _init):
        reference = self.guest_buy()['reference']
        self.pay(reference)
        guest_ticket = EventRegistration.objects.get()
        mail.outbox.clear()

        attacker = User.objects.create_user(email='ada@example.com', full_name='Attacker', password='pass12345')
        self.assertFalse(attacker.is_email_verified)
        self.client.force_authenticate(user=attacker)

        mine = self.client.get(reverse('events-my-registration', kwargs={'pk': self.event.pk}))
        self.assertEqual(mine.status_code, status.HTTP_404_NOT_FOUND)

        response = self.client.post(reverse('events-register', kwargs={'pk': self.event.pk}),
                                    {'ticket_type': self.vip.pk}, format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data['code'], 'verify_email_required')
        self.assertNotIn('token', response.data)

        guest_ticket.refresh_from_db()
        self.assertIsNone(guest_ticket.user)                     # not taken over
        self.assertEqual(mail.outbox[0].to, ['ada@example.com'])  # the real inbox gets the ticket instead

    def test_unverified_account_cannot_hijack_a_pending_guest_checkout(self, _init):
        self.guest_buy()
        attacker = User.objects.create_user(email='ada@example.com', full_name='Attacker', password='pass12345')
        self.client.force_authenticate(user=attacker)
        with mock.patch('events.ticketing.verify_payment', return_value=paystack_verified('ongoing')):
            response = self.client.post(reverse('events-register', kwargs={'pk': self.event.pk}),
                                        {'ticket_type': self.vip.pk}, format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIsNone(EventRegistration.objects.get().user)

    # ── #2 refunds and disputes ──────────────────────────────────────────────

    def test_full_refund_cancels_the_ticket_and_it_fails_at_the_gate(self, _init):
        reference = self.guest_buy()['reference']
        self.pay(reference)
        ticket = EventRegistration.objects.get()
        mail.outbox.clear()

        with self.captureOnCommitCallbacks(execute=True):
            response = signed_webhook(self.client, {'event': 'refund.processed', 'data': {
                'transaction_reference': reference, 'amount': 250_000, 'status': 'processed'}})
        self.assertEqual(response.status_code, 200)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, EventRegistration.Status.CANCELLED)
        self.assertEqual(TicketPayment.objects.get().status, TicketPayment.Status.REFUNDED)
        self.assertTrue(any('refunded' in m.subject.lower() for m in mail.outbox))   # admins told

        self.client.force_authenticate(user=self.staff)
        scan = self.client.post(reverse('admin-event-registration-check-in-by-token'),
                                {'token': ticket.short_code, 'event': self.event.pk})
        self.assertEqual((scan.status_code, scan.data['status']), (400, 'cancelled'))
        self.assertEqual(self.client.get(reverse('event-ticket', kwargs={'token': ticket.token})).status_code, 404)

    def test_refund_is_idempotent_and_a_replayed_success_cannot_revive_it(self, _init):
        reference = self.guest_buy()['reference']
        self.pay(reference)
        payload = {'event': 'refund.processed', 'data': {'transaction_reference': reference, 'amount': 250_000}}
        signed_webhook(self.client, payload)
        signed_webhook(self.client, payload)
        # Paystack (or an attacker replaying a captured, validly signed body) re-sends the old success.
        with mock.patch('events.ticketing.verify_payment', return_value=paystack_verified(amount=250_000)) as verify:
            signed_webhook(self.client, {'event': 'charge.success', 'data': {'reference': reference}})
        verify.assert_not_called()
        self.assertEqual(TicketPayment.objects.get().status, TicketPayment.Status.REFUNDED)
        self.assertEqual(EventRegistration.objects.get().status, EventRegistration.Status.CANCELLED)

    def test_partial_refund_keeps_the_ticket_and_flags_it(self, _init):
        reference = self.guest_buy()['reference']
        self.pay(reference)
        signed_webhook(self.client, {'event': 'refund.processed', 'data': {'transaction_reference': reference, 'amount': 50_000}})
        payment = TicketPayment.objects.get()
        self.assertEqual((payment.status, payment.needs_attention), (TicketPayment.Status.SUCCESSFUL, Attention.PARTIAL_REFUND))
        self.assertEqual(EventRegistration.objects.get().status, EventRegistration.Status.CONFIRMED)

    def test_refunding_a_duplicate_payment_keeps_the_ticket(self, _init):
        first = self.guest_buy()['reference']
        self.pay(first)
        ticket = EventRegistration.objects.get()
        # A second, duplicate payment for the same ticket (e.g. paid an old checkout link again).
        duplicate = TicketPayment.objects.create(registration=ticket, event=self.event, email=ticket.email,
                                                 ticket_type=self.vip, reference='NACOS-DUP', amount_kobo=250_000)
        self.pay(duplicate.reference)
        duplicate.refresh_from_db()
        self.assertEqual(duplicate.needs_attention, Attention.DUPLICATE)

        signed_webhook(self.client, {'event': 'refund.processed', 'data': {'transaction_reference': 'NACOS-DUP', 'amount': 250_000}})
        duplicate.refresh_from_db()
        ticket.refresh_from_db()
        self.assertEqual((duplicate.status, duplicate.needs_attention), (TicketPayment.Status.REFUNDED, ''))
        self.assertEqual(ticket.status, EventRegistration.Status.CONFIRMED)   # the first payment still stands

    def test_dispute_flags_the_payment_and_emails_admins(self, _init):
        reference = self.guest_buy()['reference']
        self.pay(reference)
        mail.outbox.clear()
        with self.captureOnCommitCallbacks(execute=True):
            signed_webhook(self.client, {'event': 'charge.dispute.create', 'data': {'transaction': {'reference': reference}}})
        self.assertEqual(TicketPayment.objects.get().needs_attention, Attention.DISPUTED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['admin@nacos.test'])

    def test_unknown_refund_reference_is_ignored_not_an_error(self, _init):
        response = signed_webhook(self.client, {'event': 'refund.processed', 'data': {'transaction_reference': 'SOMEONE-ELSES'}})
        self.assertEqual(response.status_code, 200)

    # ── #3 / #6 / #7 stored card data, flags, logs ───────────────────────────

    def test_card_details_and_authorization_code_are_never_stored(self, _init):
        reference = self.guest_buy()['reference']
        self.pay(reference, authorization={'authorization_code': 'AUTH_secret', 'last4': '4081', 'reusable': True},
                 customer={'email': 'ada@example.com', 'phone': '0801'})
        stored = TicketPayment.objects.get().gateway_payload
        self.assertNotIn('authorization', stored)
        self.assertNotIn('customer', stored)
        self.assertNotIn('AUTH_secret', json.dumps(stored))
        self.assertEqual(stored['amount'], 250_000)

    def test_underpayment_is_flagged_and_logged_without_personal_data(self, _init):
        reference = self.guest_buy()['reference']
        with self.assertLogs('events.ticketing', level='WARNING') as logs:
            self.pay(reference, amount=100, customer={'email': 'ada@example.com'})
        payment = TicketPayment.objects.get()
        self.assertEqual((payment.status, payment.needs_attention), (TicketPayment.Status.FAILED, Attention.UNDERPAID))
        self.assertNotIn('ada@example.com', '\n'.join(logs.output))
        self.assertEqual(EventRegistration.objects.get().status, EventRegistration.Status.PENDING_PAYMENT)

    # ── #4 references, #5 roster, #8 wording ─────────────────────────────────

    def test_references_carry_128_random_bits(self, _init):
        reference = self.guest_buy()['reference']
        random_part = reference.rsplit('-', 1)[1]
        self.assertEqual(len(random_part), 32)
        int(random_part, 16)

    def test_gate_roster_never_includes_qr_secrets(self, _init):
        self.pay(self.guest_buy()['reference'])
        self.client.force_authenticate(user=self.staff)
        roster = self.client.get(reverse('admin-event-registration-list'), {'event': self.event.pk})
        self.assertEqual(len(roster.data), 1)
        self.assertNotIn('token', roster.data[0])
        self.assertNotIn(str(EventRegistration.objects.get().token), json.dumps(roster.data, default=str))

    def test_repeat_email_message_does_not_confirm_a_ticket_exists(self, _init):
        free = Event.objects.create(title='Talk', start_time=timezone.now() + timedelta(days=1), location='Hall',
                                    audience=Event.Audience.PUBLIC)
        self.client.force_authenticate(user=None)
        url = reverse('events-register', kwargs={'pk': free.pk})
        self.client.post(url, {'name': 'Ada', 'email': 'ada@example.com'}, format='json')
        response = self.client.post(url, {'name': 'Ada', 'email': 'ada@example.com'}, format='json')
        self.assertTrue(response.data['detail'].startswith('If this email already has a ticket'))


@unittest.skipUnless(connection.vendor == 'postgresql', 'Row locks need PostgreSQL; SQLite serialises writes anyway.')
@override_settings(**SECURE)
class ConcurrentWebhookTest(TransactionTestCase):
    """The same payment confirmed by two requests at the same instant: one ticket, one email."""

    def test_simultaneous_confirmations_issue_once(self):
        event = Event.objects.create(title='Gala', start_time=timezone.now() + timedelta(days=3), location='Hall')
        vip = TicketType.objects.create(event=event, name='VIP', price=Decimal('2500'))
        ticket = EventRegistration.objects.create(event=event, name='Ada', email='ada@example.com', ticket_type=vip,
                                                  status=EventRegistration.Status.PENDING_PAYMENT, amount_kobo=250_000)
        TicketPayment.objects.create(registration=ticket, event=event, email=ticket.email, ticket_type=vip,
                                     reference='NACOS-RACE', amount_kobo=250_000)

        barrier = threading.Barrier(4)
        sent = []

        def confirm():
            from django.db import connections
            try:
                barrier.wait()
                settle_payment('NACOS-RACE')
            finally:
                connections.close_all()

        with mock.patch('events.ticketing.verify_payment', return_value=paystack_verified(amount=250_000)), \
                mock.patch('events.ticketing.send_ticket_email', side_effect=lambda r: sent.append(r.pk)):
            threads = [threading.Thread(target=confirm) for _ in range(4)]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()

        ticket.refresh_from_db()
        payment = TicketPayment.objects.get()
        self.assertEqual(ticket.status, EventRegistration.Status.CONFIRMED)
        self.assertEqual((payment.status, payment.needs_attention), (TicketPayment.Status.SUCCESSFUL, ''))
        self.assertEqual(sent, [ticket.pk])   # exactly one ticket email
