# backend/events/test_ticketing.py
"""Ticket types and Paystack payments. Paystack is mocked; nothing leaves the machine."""
import hashlib
import hmac
import json
from datetime import timedelta
from decimal import Decimal
from unittest import mock

from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.models import User

from .models import Event, EventRegistration, TicketPayment, TicketType
from .paystack import PaystackError

PAYSTACK_KEY = 'sk_test_dummy'


def fake_initialize(**kwargs):
    return {'authorization_url': f"https://checkout.paystack.com/{kwargs['reference']}", 'reference': kwargs['reference']}


def paystack_verified(status_='success', amount=0):
    return {'status': status_, 'amount': amount, 'currency': 'NGN', 'fees': 150, 'id': 4242}


@override_settings(
    PAYSTACK_SECRET_KEY=PAYSTACK_KEY,
    FRONTEND_URL='https://front.test',
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
)
@mock.patch('events.ticketing.initialize_payment', side_effect=fake_initialize)
class TicketTypeAndPaymentTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(email='student@example.com', full_name='Student One', password='pass12345')
        self.other = User.objects.create_user(email='other@example.com', full_name='Student Two', password='pass12345')
        self.staff = User.objects.create_user(email='staff@example.com', full_name='Staff One', password='pass12345', role='admin')
        self.event = Event.objects.create(
            title='Dinner', start_time=timezone.now() + timedelta(days=3), location='Hall', is_published=True,
        )
        self.regular = TicketType.objects.create(event=self.event, name='Regular', price=Decimal('2000'), capacity=50, sort_order=0)
        self.vip = TicketType.objects.create(event=self.event, name='VIP', price=Decimal('10000'), capacity=1, sort_order=1)

    def register(self, user, ticket_type=None, event=None):
        self.client.force_authenticate(user=user)
        body = {} if ticket_type is None else {'ticket_type': ticket_type.pk}
        return self.client.post(reverse('events-register', kwargs={'pk': (event or self.event).pk}), body, format='json')

    def verify(self, user, reference, verified):
        self.client.force_authenticate(user=user)
        with mock.patch('events.ticketing.verify_payment', return_value=verified):
            return self.client.get(reverse('paystack-verify', kwargs={'reference': reference}))

    def pay(self, user, ticket_type):
        reference = self.register(user, ticket_type).data['reference']
        self.verify(user, reference, paystack_verified(amount=ticket_type.price_kobo))
        return reference

    # ── Event create / edit with ticket types ─────────────────────────────────

    def test_staff_creates_event_with_ticket_types_and_poster(self, _init):
        self.client.force_authenticate(user=self.staff)
        poster = 'https://res.cloudinary.com/demo/image/upload/v1/nacos/gala.jpg'
        response = self.client.post(reverse('events-list'), {
            'title': 'Gala', 'start_time': (timezone.now() + timedelta(days=5)).isoformat(), 'location': 'Hall',
            'poster_url': poster, 'capacity': 100,
            'ticket_types': [{'name': 'Regular', 'price': 2000, 'capacity': 80}, {'name': 'VIP', 'price': '7500.50'}],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual([t['name'] for t in response.data['ticket_types']], ['Regular', 'VIP'])
        self.assertTrue(response.data['is_paid'])
        self.assertEqual(Decimal(str(response.data['price_from'])), Decimal('2000'))
        self.assertEqual(response.data['ticket_types'][0]['tickets_remaining'], 80)
        self.assertEqual(response.data['ticket_types'][1]['tickets_remaining'], 100)  # limited by the event
        self.assertEqual(response.data['media']['poster'], poster)

    def test_duplicate_ticket_type_names_rejected(self, _init):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(reverse('events-list'), {
            'title': 'Gala', 'start_time': (timezone.now() + timedelta(days=5)).isoformat(), 'location': 'Hall',
            'ticket_types': [{'name': 'VIP', 'price': 1}, {'name': 'vip ', 'price': 2}],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_edit_syncs_ticket_types(self, _init):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(reverse('events-detail', kwargs={'pk': self.event.pk}), {
            'ticket_types': [
                {'id': self.regular.pk, 'name': 'Regular', 'price': 2500, 'capacity': 40},
                {'name': 'Student', 'price': 0},
            ],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual([t['name'] for t in response.data['ticket_types']], ['Regular', 'Student'])
        self.assertFalse(TicketType.objects.filter(pk=self.vip.pk).exists())
        self.regular.refresh_from_db()
        self.assertEqual((self.regular.price, self.regular.capacity), (Decimal('2500'), 40))

    def test_edit_without_ticket_types_leaves_them_alone(self, _init):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(reverse('events-detail', kwargs={'pk': self.event.pk}), {'title': 'Dinner 2'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.event.ticket_types.count(), 2)

    def test_sold_type_price_locked_and_cannot_be_removed(self, _init):
        self.register(self.student, self.vip)
        self.client.force_authenticate(user=self.staff)
        url = reverse('events-detail', kwargs={'pk': self.event.pk})
        response = self.client.patch(url, {'ticket_types': [
            {'id': self.regular.pk, 'name': 'Regular', 'price': 2000},
            {'id': self.vip.pk, 'name': 'VIP', 'price': 12000},
        ]}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.patch(url, {'ticket_types': [{'id': self.regular.pk, 'name': 'Regular', 'price': 2000}]}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(TicketType.objects.filter(pk=self.vip.pk).exists())
        # Renaming a sold type is fine.
        response = self.client.patch(url, {'ticket_types': [
            {'id': self.regular.pk, 'name': 'Regular', 'price': 2000},
            {'id': self.vip.pk, 'name': 'VVIP', 'price': 10000},
        ]}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

    def test_event_capacity_cannot_drop_below_tickets_taken(self, _init):
        self.register(self.student, self.regular)
        self.register(self.other, self.regular)
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(reverse('events-detail', kwargs={'pk': self.event.pk}), {'capacity': 1}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Registering ───────────────────────────────────────────────────────────

    def test_event_without_ticket_types_stays_free(self, init):
        free = Event.objects.create(title='Talk', start_time=timezone.now() + timedelta(days=1), location='Hall')
        response = self.register(self.student, event=free)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'confirmed')
        self.assertTrue(response.data['token'])
        init.assert_not_called()

    def test_choosing_a_type_is_required_when_several(self, _init):
        response = self.register(self.student)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 'ticket_type_required')
        self.assertEqual(len(response.data['ticket_types']), 2)

    def test_type_from_another_event_rejected(self, _init):
        other_event = Event.objects.create(title='Other', start_time=timezone.now() + timedelta(days=1), location='Hall')
        foreign = TicketType.objects.create(event=other_event, name='Regular', price=0)
        response = self.register(self.student, foreign)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_single_type_needs_no_choice(self, init):
        single = Event.objects.create(title='Talk', start_time=timezone.now() + timedelta(days=1), location='Hall')
        TicketType.objects.create(event=single, name='Regular', price=0)
        response = self.register(self.student, event=single)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['ticket_type']['name'], 'Regular')

    def test_free_ticket_type_confirms_immediately(self, init):
        student_type = TicketType.objects.create(event=self.event, name='Student', price=0)
        response = self.register(self.student, student_type)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'confirmed')
        self.assertEqual(response.data['ticket_type']['name'], 'Student')
        init.assert_not_called()

    def test_paid_ticket_starts_paystack_checkout_without_qr(self, init):
        response = self.register(self.student, self.vip)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending_payment')
        self.assertIsNone(response.data['token'])
        self.assertTrue(response.data['checkout_url'].startswith('https://checkout.paystack.com/'))
        kwargs = init.call_args.kwargs
        self.assertEqual(kwargs['amount_kobo'], 1_000_000)
        self.assertEqual(kwargs['email'], 'student@example.com')
        self.assertEqual(kwargs['callback_url'], f'https://front.test/events/{self.event.pk}')

        with mock.patch('events.ticketing.verify_payment', return_value=paystack_verified('ongoing')):
            again = self.register(self.student, self.vip)
        self.assertEqual(again.status_code, status.HTTP_200_OK)
        self.assertEqual(again.data['reference'], response.data['reference'])
        self.assertEqual(init.call_count, 1)

    def test_type_capacity_sells_out_other_types_still_sell(self, _init):
        self.assertEqual(self.register(self.student, self.vip).status_code, status.HTTP_201_CREATED)
        response = self.register(self.other, self.vip)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data['code'], 'sold_out')
        self.assertIn('VIP', response.data['detail'])
        self.assertEqual(self.register(self.other, self.regular).status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=None)
        detail = self.client.get(reverse('events-detail', kwargs={'pk': self.event.pk})).data
        vip = next(t for t in detail['ticket_types'] if t['name'] == 'VIP')
        self.assertTrue(vip['sold_out'])
        self.assertFalse(detail['sold_out'])

    def test_event_capacity_counts_all_types(self, _init):
        self.event.capacity = 1
        self.event.save()
        self.register(self.student, self.regular)
        response = self.register(self.other, self.regular)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_expired_hold_frees_the_seat(self, _init):
        self.register(self.student, self.vip)
        EventRegistration.objects.filter(user=self.student).update(hold_expires_at=timezone.now() - timedelta(minutes=1))
        self.assertEqual(self.register(self.other, self.vip).status_code, status.HTTP_201_CREATED)

    def test_paystack_failure_returns_502_and_releases_hold(self, init):
        init.side_effect = PaystackError('down')
        response = self.register(self.student, self.vip)
        self.assertEqual(response.status_code, 502)
        registration = EventRegistration.objects.get(user=self.student)
        self.assertLessEqual(registration.hold_expires_at, timezone.now())
        self.assertEqual(TicketPayment.objects.get().status, TicketPayment.Status.FAILED)

    # ── Confirming payment ────────────────────────────────────────────────────

    def test_verify_confirms_and_emails(self, _init):
        reference = self.register(self.student, self.vip).data['reference']
        response = self.verify(self.student, reference, paystack_verified(amount=1_000_000))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['payment_status'], 'successful')
        self.assertEqual(response.data['status'], 'confirmed')
        self.assertTrue(response.data['token'])
        self.assertEqual(response.data['amount_paid'], 10000)
        payment = TicketPayment.objects.get(reference=reference)
        self.assertEqual((payment.fees_kobo, payment.paystack_id), (150, '4242'))

    def test_confirmation_email_sent_once(self, _init):
        reference = self.register(self.student, self.vip).data['reference']
        with self.captureOnCommitCallbacks(execute=True):
            self.verify(self.student, reference, paystack_verified(amount=1_000_000))
        with self.captureOnCommitCallbacks(execute=True):
            self.verify(self.student, reference, paystack_verified(amount=1_000_000))
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('VIP', mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, ['student@example.com'])

    def test_verify_rejects_other_users(self, _init):
        reference = self.register(self.student, self.vip).data['reference']
        response = self.verify(self.other, reference, paystack_verified(amount=1_000_000))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_underpayment_is_not_confirmed(self, _init):
        reference = self.register(self.student, self.vip).data['reference']
        response = self.verify(self.student, reference, paystack_verified(amount=100))
        self.assertEqual(response.data['status'], 'pending_payment')
        self.assertEqual(TicketPayment.objects.get(reference=reference).status, TicketPayment.Status.FAILED)

    def test_paying_an_old_checkout_after_switching_type_gives_the_paid_type(self, _init):
        vip_ref = self.register(self.student, self.vip).data['reference']
        with mock.patch('events.ticketing.verify_payment', return_value=paystack_verified('ongoing')):
            self.register(self.student, self.regular)
        registration = EventRegistration.objects.get(user=self.student)
        self.assertEqual(registration.ticket_type, self.regular)
        self.verify(self.student, vip_ref, paystack_verified(amount=1_000_000))
        registration.refresh_from_db()
        self.assertEqual((registration.status, registration.ticket_type, registration.amount_kobo), ('confirmed', self.vip, 1_000_000))

    def test_my_registration_settles_pending_payment(self, _init):
        self.register(self.student, self.vip)
        with mock.patch('events.ticketing.verify_payment', return_value=paystack_verified(amount=1_000_000)):
            response = self.client.get(reverse('events-my-registration', kwargs={'pk': self.event.pk}))
        self.assertEqual(response.data['status'], 'confirmed')
        self.assertIsNone(response.data['checkout_url'])

    def test_webhook(self, _init):
        reference = self.register(self.student, self.vip).data['reference']
        url = reverse('paystack-webhook')
        body = json.dumps({'event': 'charge.success', 'data': {'reference': reference}}).encode()
        self.client.force_authenticate(user=None)

        response = self.client.post(url, body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE='bad')
        self.assertEqual(response.status_code, 401)

        signature = hmac.new(PAYSTACK_KEY.encode(), body, hashlib.sha512).hexdigest()
        with mock.patch('events.ticketing.verify_payment', return_value=paystack_verified(amount=1_000_000)):
            response = self.client.post(url, body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=signature)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(EventRegistration.objects.get(user=self.student).status, 'confirmed')

    # ── Check-in, roster, delete ──────────────────────────────────────────────

    def test_unpaid_ticket_cannot_check_in_and_is_hidden_from_roster(self, _init):
        self.register(self.student, self.vip)
        registration = EventRegistration.objects.get(user=self.student)
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(reverse('admin-event-registration-check-in-by-token'), {
            'token': str(registration.token), 'event': self.event.pk,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'not_paid')
        response = self.client.post(reverse('admin-event-registration-check-in', kwargs={'pk': registration.pk}))
        self.assertEqual(response.data['status'], 'not_paid')
        roster = self.client.get(reverse('admin-event-registration-list'), {'event': self.event.pk})
        self.assertEqual(roster.data, [])

    def test_paid_ticket_checks_in_with_type(self, _init):
        self.pay(self.student, self.vip)
        registration = EventRegistration.objects.get(user=self.student)
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(reverse('admin-event-registration-check-in-by-token'), {
            'token': str(registration.token), 'event': self.event.pk,
        })
        self.assertEqual(response.data['status'], 'checked_in')
        self.assertEqual(response.data['registration']['ticket_type']['name'], 'VIP')

    def test_event_with_paid_tickets_cannot_be_deleted(self, _init):
        self.pay(self.student, self.vip)
        self.client.force_authenticate(user=self.staff)
        response = self.client.delete(reverse('events-detail', kwargs={'pk': self.event.pk}))
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(Event.objects.filter(pk=self.event.pk).exists())

    def test_event_with_only_unpaid_checkouts_can_be_deleted(self, _init):
        self.register(self.student, self.vip)
        self.client.force_authenticate(user=self.staff)
        response = self.client.delete(reverse('events-detail', kwargs={'pk': self.event.pk}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TicketPayment.objects.exists())

    def test_deleting_a_user_keeps_their_payment_record(self, _init):
        reference = self.pay(self.student, self.vip)
        self.student.delete()
        payment = TicketPayment.objects.get(reference=reference)
        self.assertIsNone(payment.registration)
        self.assertEqual(payment.email, 'student@example.com')


class EventManagerPermissionTest(APITestCase):
    """Admins and every exco can upload, edit and delete events; students can't."""

    def setUp(self):
        self.client = APIClient()
        self.exco = User.objects.create_user(email='pro@example.com', full_name='PRO', password='pass12345', role='public_relations_officer')
        self.student = User.objects.create_user(email='student@example.com', full_name='Student', password='pass12345', role='student')
        self.draft = Event.objects.create(title='Draft', start_time=timezone.now() + timedelta(days=2), location='Hall', is_published=False)

    def test_exco_can_create_edit_and_delete_events_and_see_drafts(self):
        self.client.force_authenticate(user=self.exco)
        listing = self.client.get(reverse('events-list'))
        self.assertIn('Draft', [e['title'] for e in listing.data['results']])

        created = self.client.post(reverse('events-list'), {
            'title': 'Exco Event', 'start_time': (timezone.now() + timedelta(days=4)).isoformat(), 'location': 'Hall',
        }, format='json')
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.data)
        edited = self.client.patch(reverse('events-detail', kwargs={'pk': created.data['id']}), {'title': 'Renamed'}, format='json')
        self.assertEqual(edited.status_code, status.HTTP_200_OK)
        deleted = self.client.delete(reverse('events-detail', kwargs={'pk': self.draft.pk}))
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)

    def test_student_cannot_manage_events_or_see_drafts(self):
        self.client.force_authenticate(user=self.student)
        listing = self.client.get(reverse('events-list'))
        self.assertNotIn('Draft', [e['title'] for e in listing.data['results']])
        response = self.client.post(reverse('events-list'), {
            'title': 'Nope', 'start_time': (timezone.now() + timedelta(days=4)).isoformat(), 'location': 'Hall',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.delete(reverse('events-detail', kwargs={'pk': self.draft.pk}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TicketTypeVenueTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create_user(email='staff@example.com', full_name='Staff', password='pass12345', role='admin')
        self.student = User.objects.create_user(email='student@example.com', full_name='Student', password='pass12345')

    def test_each_type_can_have_its_own_venue(self):
        self.client.force_authenticate(user=self.staff)
        created = self.client.post(reverse('events-list'), {
            'title': 'Dinner', 'start_time': (timezone.now() + timedelta(days=4)).isoformat(), 'location': 'Main Hall',
            'ticket_types': [{'name': 'Regular', 'price': 0}, {'name': 'VIP', 'price': 0, 'venue': '  VIP Lounge  '}],
        }, format='json')
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.data)
        regular, vip = created.data['ticket_types']
        self.assertEqual((regular['venue'], vip['venue']), ('', 'VIP Lounge'))

        self.client.force_authenticate(user=self.student)
        url = reverse('events-register', kwargs={'pk': created.data['id']})
        response = self.client.post(url, {'ticket_type': vip['id']}, format='json')
        self.assertEqual(response.data['ticket_type']['venue'], 'VIP Lounge')

        other = User.objects.create_user(email='other@example.com', full_name='Other', password='pass12345')
        self.client.force_authenticate(user=other)
        response = self.client.post(url, {'ticket_type': regular['id']}, format='json')
        self.assertEqual(response.data['ticket_type']['venue'], 'Main Hall')  # falls back to the event location

        self.client.force_authenticate(user=self.staff)
        edited = self.client.patch(reverse('events-detail', kwargs={'pk': created.data['id']}), {'ticket_types': [
            {'id': regular['id'], 'name': 'Regular', 'price': 0, 'venue': 'Hall B'},
            {'id': vip['id'], 'name': 'VIP', 'price': 0, 'venue': ''},
        ]}, format='json')
        self.assertEqual([t['venue'] for t in edited.data['ticket_types']], ['Hall B', ''])
