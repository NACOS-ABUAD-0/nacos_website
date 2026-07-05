from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from events.models import Event
from projects.models import Project


class AdminStatsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create_user(
            email='staff@example.com', full_name='Staff One', password='pass12345', role='admin',
        )
        self.student1 = User.objects.create_user(
            email='s1@example.com', full_name='Student One', password='pass12345',
        )
        self.student2 = User.objects.create_user(
            email='s2@example.com', full_name='Student Two', password='pass12345',
        )
        Project.objects.create(owner=self.student1, title='Test Project', description='Desc')
        Event.objects.create(
            title='Test Event', start_time=timezone.now() + timedelta(days=1), location='Hall',
        )

    def test_non_admin_cannot_view_stats(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.get(reverse('admin-stats'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_view_stats(self):
        response = self.client.get(reverse('admin-stats'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_sees_real_counts(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse('admin-stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Two real students created; the admin account is excluded.
        self.assertEqual(response.data['students'], 2)
        self.assertEqual(response.data['projects'], 1)
        self.assertEqual(response.data['events'], 1)

        expected_keys = {
            'students', 'projects', 'skills', 'events', 'resources',
            'committees', 'committee_applications', 'gallery_images',
            'inquiries', 'event_registrations', 'class_sessions',
            'class_attendances', 'executives',
        }
        self.assertEqual(set(response.data.keys()), expected_keys)
        for key in expected_keys:
            self.assertIsInstance(response.data[key], int)
            self.assertGreaterEqual(response.data[key], 0)
