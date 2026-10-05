# backend/events/test_guest_tickets.py
"""Open events: no sign-in, just name + email, one ticket per email. Paystack is mocked."""
from datetime import timedelta
from decimal import Decimal
from unittest import mock

from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.models import User

from .models import Event, EventRegistration, TicketType
from .test_ticketing import PAYSTACK_KEY, fake_initialize, paystack_verified


@override_settings(
    PAYSTACK_SECRET_KEY=PAYSTACK_KEY,
    FRONTEND_URL='https://front.test',
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
)
@mock.patch('events.ticketing.initialize_payment', side_effect=fake_initialize)
class GuestTicketTest(APITestCase):
    def setUp(self):
        cache.clear()  # guest throttle
        self.client = APIClient()
        self.open_event = Event.objects.create(
            title='Tech Fair', start_time=timezone.now() + timedelta(days=2), location='Hall', audience=Event.Audience.PUBLIC,
        )
        self.members_event = Event.objects.create(title='AGM', start_time=timezone.now() + timedelta(days=2), location='Hall')
        self.staff = User.objects.create_user(email='staff@example.com', full_name='Staff', password='pass12345', role='admin')

    def guest_register(self, event, **body):
        self.client.force_authenticate(user=None)
        return self.client.post(reverse('events-register', kwargs={'pk': event.pk}), body, format='json')

    def member_register(self, member, event, **body):
        self.client.force_authenticate(user=member)
        return self.client.post(reverse('events-register', kwargs={'pk': event.pk}), body, format='json')

    def test_guest_gets_free_ticket_with_name_and_email(self, init):
        with self.captureOnCommitCallbacks(execute=True):
            response = self.guest_register(self.open_event, name='Ada Guest', email='Ada@Example.com ')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['status'], 'confirmed')
        self.assertTrue(response.data['token'])
        registration = EventRegistration.objects.get()
        self.assertEqual((registration.user, registration.name, registration.email), (None, 'Ada Guest', 'ada@example.com'))
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(f"https://front.test/tickets/{registration.token}", mail.outbox[0].body)
        init.assert_not_called()

    def test_guest_must_give_name_and_valid_email(self, _init):
        response = self.guest_register(self.open_event, name='', email='not-an-email')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('email', response.data)

    def test_one_ticket_per_email_and_it_is_resent_not_shown(self, _init):
        self.guest_register(self.open_event, name='Ada Guest', email='ada@example.com')
        mail.outbox.clear()
        response = self.guest_register(self.open_event, name='Someone Else', email='ADA@example.com')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data['code'], 'ticket_already_issued')
        self.assertNotIn('token', response.data)
        self.assertEqual(EventRegistration.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['ada@example.com'])

    def test_members_only_event_requires_sign_in(self, _init):
        response = self.guest_register(self.members_event, name='Ada Guest', email='ada@example.com')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['code'], 'sign_in_required')

    def test_guest_pays_and_confirms_without_an_account(self, init):
        vip = TicketType.objects.create(event=self.open_event, name='VIP', price=Decimal('5000'))
        response = self.guest_register(self.open_event, name='Ada Guest', email='ada@example.com', ticket_type=vip.pk)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['token'])
        self.assertEqual(init.call_args.kwargs['email'], 'ada@example.com')

        self.client.force_authenticate(user=None)
        with mock.patch('events.ticketing.verify_payment', return_value=paystack_verified(amount=500_000)):
            verified = self.client.get(reverse('paystack-verify', kwargs={'reference': response.data['reference']}))
        self.assertEqual(verified.status_code, status.HTTP_200_OK)
        self.assertEqual(verified.data['status'], 'confirmed')
        self.assertTrue(verified.data['token'])

    def test_member_payment_cannot_be_confirmed_by_someone_else(self, _init):
        member = User.objects.create_user(email='member@example.com', full_name='Member', password='pass12345')
        vip = TicketType.objects.create(event=self.open_event, name='VIP', price=Decimal('5000'))
        reference = self.member_register(member, self.open_event, ticket_type=vip.pk).data['reference']
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse('paystack-verify', kwargs={'reference': reference}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_ticket_page_by_token(self, _init):
        token = self.guest_register(self.open_event, name='Ada Guest', email='ada@example.com').data['token']
        response = self.client.get(reverse('event-ticket', kwargs={'token': token}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual((response.data['name'], response.data['event']['title']), ('Ada Guest', 'Tech Fair'))
        missing = self.client.get(reverse('event-ticket', kwargs={'token': '00000000-0000-0000-0000-000000000000'}))
        self.assertEqual(missing.status_code, status.HTTP_404_NOT_FOUND)

    def test_unpaid_ticket_page_is_hidden(self, _init):
        vip = TicketType.objects.create(event=self.open_event, name='VIP', price=Decimal('5000'))
        self.guest_register(self.open_event, name='Ada Guest', email='ada@example.com', ticket_type=vip.pk)
        token = EventRegistration.objects.get().token
        self.assertEqual(self.client.get(reverse('event-ticket', kwargs={'token': token})).status_code, 404)

    def test_member_who_registered_as_guest_sees_that_ticket_after_signing_in(self, _init):
        self.guest_register(self.open_event, name='Ada Guest', email='ada@example.com')
        member = User.objects.create_user(email='ada@example.com', full_name='Ada Member', password='pass12345')
        self.client.force_authenticate(user=member)
        mine = self.client.get(reverse('events-my-registration', kwargs={'pk': self.open_event.pk}))
        self.assertEqual(mine.status_code, status.HTTP_200_OK)
        again = self.member_register(member, self.open_event)
        self.assertEqual(again.status_code, status.HTTP_200_OK)
        self.assertEqual(EventRegistration.objects.get().user, member)

    def test_signed_in_member_on_open_event_uses_account_details(self, _init):
        member = User.objects.create_user(email='member@example.com', full_name='Member One', password='pass12345')
        response = self.member_register(member, self.open_event, name='Ignored', email='ignored@example.com')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        registration = EventRegistration.objects.get()
        self.assertEqual((registration.name, registration.email, registration.user), ('Member One', 'member@example.com', member))

    def test_guest_shows_on_roster_and_checks_in(self, _init):
        token = self.guest_register(self.open_event, name='Ada Guest', email='ada@example.com').data['token']
        self.client.force_authenticate(user=self.staff)
        roster = self.client.get(reverse('admin-event-registration-list'), {'event': self.open_event.pk, 'search': 'ada'})
        self.assertEqual([(r['name'], r['email'], r['user']) for r in roster.data], [('Ada Guest', 'ada@example.com', None)])
        response = self.client.post(reverse('admin-event-registration-check-in-by-token'), {'token': token, 'event': self.open_event.pk})
        self.assertEqual(response.data['status'], 'checked_in')

    def test_admin_sets_audience(self, _init):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(reverse('events-detail', kwargs={'pk': self.members_event.pk}), {'audience': 'public'}, format='json')
        self.assertEqual(response.data['audience'], 'public')
