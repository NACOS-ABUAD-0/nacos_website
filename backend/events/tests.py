# backend/events/tests.py
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from accounts.models import User
from .models import Event, EventRegistration


class EventPermissionTest(APITestCase):
    """Regression coverage for the AllowAny → IsAdminOrReadOnly permission fix."""

    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345'
        )
        self.staff = User.objects.create_user(
            email='staff@example.com', full_name='Staff One', password='pass12345', role='admin'
        )
        self.published = Event.objects.create(
            title='Published Event',
            start_time=timezone.now() + timedelta(days=1),
            location='Main Hall',
            is_published=True,
        )
        self.unpublished = Event.objects.create(
            title='Unpublished Event',
            start_time=timezone.now() + timedelta(days=1),
            location='Main Hall',
            is_published=False,
        )

    def test_anonymous_can_list_published_events_only(self):
        response = self.client.get(reverse('events-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [e['title'] for e in response.data['results']] if 'results' in response.data else [e['title'] for e in response.data]
        self.assertIn('Published Event', titles)
        self.assertNotIn('Unpublished Event', titles)

    def test_anonymous_cannot_create_event(self):
        # No credentials at all → DRF's permission_denied() raises
        # NotAuthenticated (401), not PermissionDenied (403), since no
        # authenticator succeeded (see test_non_staff_authenticated_cannot_create_event
        # for the 403 case where the user IS authenticated but lacks permission).
        response = self.client.post(reverse('events-list'), {
            'title': 'Hacked Event', 'start_time': timezone.now() + timedelta(days=2), 'location': 'X',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_staff_authenticated_cannot_create_event(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse('events-list'), {
            'title': 'Student Event', 'start_time': timezone.now() + timedelta(days=2), 'location': 'X',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_create_event(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(reverse('events-list'), {
            'title': 'Staff Event', 'start_time': timezone.now() + timedelta(days=2), 'location': 'X',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class EventRegistrationTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345',
            matric_number='23/sci01/002',
        )
        self.other_student = User.objects.create_user(
            email='other@example.com', full_name='Student Two', password='pass12345',
        )
        self.staff = User.objects.create_user(
            email='staff@example.com', full_name='Staff One', password='pass12345', role='admin'
        )
        self.upcoming_event = Event.objects.create(
            title='Upcoming Event',
            start_time=timezone.now() + timedelta(days=1),
            location='Main Hall',
            is_published=True,
        )
        self.past_event = Event.objects.create(
            title='Past Event',
            start_time=timezone.now() - timedelta(days=2),
            end_time=timezone.now() - timedelta(days=1),
            location='Main Hall',
            is_published=True,
        )

    def test_anonymous_cannot_register(self):
        response = self.client.post(reverse('events-register', kwargs={'pk': self.upcoming_event.pk}))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_can_register_for_event(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse('events-register', kwargs={'pk': self.upcoming_event.pk}))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['token'])
        self.assertIsNone(response.data['checked_in_at'])

    def test_register_twice_is_idempotent(self):
        self.client.force_authenticate(user=self.student)
        first = self.client.post(reverse('events-register', kwargs={'pk': self.upcoming_event.pk}))
        second = self.client.post(reverse('events-register', kwargs={'pk': self.upcoming_event.pk}))
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data['token'], second.data['token'])
        self.assertEqual(EventRegistration.objects.filter(event=self.upcoming_event, user=self.student).count(), 1)

    def test_registration_blocked_for_completed_event(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse('events-register', kwargs={'pk': self.past_event.pk}))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_my_registration_404_before_registering(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse('events-my-registration', kwargs={'pk': self.upcoming_event.pk}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_my_registration_returns_token_after_registering(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(reverse('events-register', kwargs={'pk': self.upcoming_event.pk}))
        response = self.client.get(reverse('events-my-registration', kwargs={'pk': self.upcoming_event.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['token'])


class AdminEventRegistrationTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345',
            matric_number='23/sci01/002',
        )
        self.staff = User.objects.create_user(
            email='staff@example.com', full_name='Staff One', password='pass12345', role='admin'
        )
        self.event = Event.objects.create(
            title='Upcoming Event',
            start_time=timezone.now() + timedelta(days=1),
            location='Main Hall',
            is_published=True,
        )
        self.registration = EventRegistration.objects.create(event=self.event, user=self.student)

    def test_non_admin_cannot_list_registrations(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse('admin-event-registration-list'), {'event': self.event.pk})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_and_search_registrations_for_event(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse('admin-event-registration-list'), {
            'event': self.event.pk, 'search': 'sci01',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['user']['email'], 'student@example.com')

    def test_check_in_by_id_sets_timestamp_and_checked_in_by(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            reverse('admin-event-registration-check-in', kwargs={'pk': self.registration.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'checked_in')
        self.registration.refresh_from_db()
        self.assertIsNotNone(self.registration.checked_in_at)
        self.assertEqual(self.registration.checked_in_by, self.staff)

    def test_check_in_by_id_twice_returns_already_checked_in(self):
        self.client.force_authenticate(user=self.staff)
        url = reverse('admin-event-registration-check-in', kwargs={'pk': self.registration.pk})
        first = self.client.post(url)
        second = self.client.post(url)
        self.assertEqual(first.data['status'], 'checked_in')
        self.assertEqual(second.data['status'], 'already_checked_in')
        self.assertEqual(
            first.data['registration']['checked_in_at'],
            second.data['registration']['checked_in_at'],
        )

    def test_check_in_by_token_success(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(reverse('admin-event-registration-check-in-by-token'), {
            'token': str(self.registration.token), 'event': self.event.pk,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'checked_in')

    def test_check_in_by_token_wrong_event_returns_404(self):
        other_event = Event.objects.create(
            title='Other Event', start_time=timezone.now() + timedelta(days=1),
            location='Elsewhere', is_published=True,
        )
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(reverse('admin-event-registration-check-in-by-token'), {
            'token': str(self.registration.token), 'event': other_event.pk,
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_check_in_by_token_malformed_token_returns_404_not_500(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(reverse('admin-event-registration-check-in-by-token'), {
            'token': 'not-a-uuid', 'event': self.event.pk,
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unique_together_prevents_duplicate_registration_rows(self):
        from django.db import IntegrityError, transaction
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                EventRegistration.objects.create(event=self.event, user=self.student)
