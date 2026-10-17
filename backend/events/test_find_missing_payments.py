# backend/events/test_find_missing_payments.py
"""find_missing_payments: reconciling Paystack against the database after a restore. Paystack is mocked."""
from datetime import timedelta
from decimal import Decimal
from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.utils import timezone

from .models import Event, EventRegistration, TicketPayment, TicketType

Status = EventRegistration.Status
PaymentStatus = TicketPayment.Status


def paystack_tx(reference, email='buyer@example.com', amount=200000, metadata=None):
    return {'reference': reference, 'amount': amount, 'currency': 'NGN', 'status': 'success',
            'paid_at': '2026-10-16T10:00:00Z', 'customer': {'email': email}, 'metadata': metadata or {}}


class FindMissingPaymentsTest(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title='Dinner', start_time=timezone.now() + timedelta(days=3), location='Hall', capacity=100,
        )
        self.regular = TicketType.objects.create(event=self.event, name='Regular', price=Decimal('2000'), capacity=50)

    def payment(self, reference, status):
        registration = EventRegistration.objects.create(
            event=self.event, name='Buyer', email=f'{reference.lower()}@example.com', ticket_type=self.regular,
            status=Status.CONFIRMED if status == PaymentStatus.SUCCESSFUL else Status.PENDING_PAYMENT,
            amount_kobo=self.regular.price_kobo, hold_expires_at=timezone.now() - timedelta(minutes=5),
        )
        return TicketPayment.objects.create(
            registration=registration, event=self.event, email=registration.email, ticket_type=self.regular,
            reference=reference, amount_kobo=self.regular.price_kobo, status=status,
        )

    def run_command(self, transactions, *args):
        out = StringIO()
        with mock.patch('events.management.commands.find_missing_payments.list_successful_transactions',
                        return_value=transactions):
            call_command('find_missing_payments', '--since', '2026-10-16T02:00:00Z', *args, stdout=out)
        return out.getvalue()

    def test_reports_missing_and_unsettled_and_skips_foreign_references(self):
        self.payment('NACOS-1-DONE', PaymentStatus.SUCCESSFUL)
        self.payment('NACOS-1-LATE', PaymentStatus.PENDING)
        out = self.run_command([
            paystack_tx('NACOS-1-DONE'),
            paystack_tx('NACOS-1-LATE'),
            paystack_tx('NACOS-1-GONE', email='lost@example.com',
                        metadata={'event_id': self.event.pk, 'ticket_type': 'Regular'}),
            paystack_tx('SOMETHING-ELSE'),
        ])
        self.assertIn('4 successful Paystack transactions', out)
        self.assertIn('1 skipped', out)
        self.assertIn('MISSING (1)', out)
        self.assertIn('NACOS-1-GONE', out)
        self.assertIn('lost@example.com', out)
        self.assertIn('Dinner', out)
        self.assertIn('UNSETTLED (1)', out)
        self.assertIn('NACOS-1-LATE', out)
        self.assertNotIn('NACOS-1-DONE', out.split('MISSING')[1])
        # Read-only without --settle.
        self.assertEqual(TicketPayment.objects.get(reference='NACOS-1-LATE').status, PaymentStatus.PENDING)

    def test_settle_confirms_unsettled_payments(self):
        self.payment('NACOS-1-LATE', PaymentStatus.PENDING)
        verified = {'status': 'success', 'amount': self.regular.price_kobo, 'currency': 'NGN', 'id': 9, 'fees': 50}
        with mock.patch('events.ticketing.verify_payment', return_value=verified), \
                mock.patch('events.ticketing.send_ticket_email'):
            out = self.run_command([paystack_tx('NACOS-1-LATE')], '--settle')
        self.assertIn('-> successful', out)
        payment = TicketPayment.objects.get(reference='NACOS-1-LATE')
        self.assertEqual(payment.status, PaymentStatus.SUCCESSFUL)
        self.assertEqual(payment.registration.status, Status.CONFIRMED)

    def test_rejects_bad_since(self):
        with self.assertRaises(CommandError):
            call_command('find_missing_payments', '--since', 'yesterday', stdout=StringIO())
