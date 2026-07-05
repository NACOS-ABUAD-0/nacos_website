from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from accounts.models import User
from .models import ClassAttendance, ClassSession


class ClassSessionPermissionTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345',
        )
        self.staff = User.objects.create_user(
            email='staff@example.com', full_name='Staff One', password='pass12345', role='admin',
        )

    def test_anonymous_cannot_create_session(self):
        response = self.client.post(reverse('class-session-list'), {'course_code': 'CSC301'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_create_session(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse('class-session-list'), {'course_code': 'CSC301'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_session(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(reverse('class-session-list'), {'course_code': 'CSC301'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['token'])
        self.assertTrue(response.data['is_open'])

    def test_non_admin_cannot_close_session(self):
        session = ClassSession.objects.create(course_code='CSC301', created_by=self.staff)
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse('class-session-close', kwargs={'pk': session.pk}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ClassSessionCreateTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create_user(
            email='staff@example.com', full_name='Staff One', password='pass12345', role='admin',
        )
        self.client.force_authenticate(user=self.staff)

    def test_creating_new_session_auto_closes_previous_open_session_for_same_course(self):
        first = self.client.post(reverse('class-session-list'), {'course_code': 'CSC301'}).data
        second = self.client.post(reverse('class-session-list'), {'course_code': 'CSC301'}).data

        first_session = ClassSession.objects.get(pk=first['id'])
        self.assertIsNotNone(first_session.closed_at)

        second_session = ClassSession.objects.get(pk=second['id'])
        self.assertIsNone(second_session.closed_at)

    def test_creating_new_session_does_not_close_different_course(self):
        csc = self.client.post(reverse('class-session-list'), {'course_code': 'CSC301'}).data
        self.client.post(reverse('class-session-list'), {'course_code': 'MTH201'})

        csc_session = ClassSession.objects.get(pk=csc['id'])
        self.assertIsNone(csc_session.closed_at)

    def test_close_is_idempotent(self):
        session = ClassSession.objects.create(course_code='CSC301', created_by=self.staff)
        first = self.client.post(reverse('class-session-close', kwargs={'pk': session.pk}))
        session.refresh_from_db()
        first_closed_at = session.closed_at
        second = self.client.post(reverse('class-session-close', kwargs={'pk': session.pk}))
        session.refresh_from_db()

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(session.closed_at, first_closed_at)


class ScanAttendanceTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345',
            matric_number='23/SCI01/099',
        )
        self.staff = User.objects.create_user(
            email='staff@example.com', full_name='Staff One', password='pass12345', role='admin',
        )
        self.session = ClassSession.objects.create(course_code='CSC301', created_by=self.staff)

    def test_anonymous_cannot_scan(self):
        response = self.client.post(reverse('attendance-scan'), {'token': str(self.session.token)})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_can_scan_open_session(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse('attendance-scan'), {'token': str(self.session.token)})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'recorded')
        self.assertEqual(response.data['course_code'], 'CSC301')
        self.assertTrue(
            ClassAttendance.objects.filter(session=self.session, student=self.student).exists()
        )

    def test_scanning_twice_is_idempotent(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(reverse('attendance-scan'), {'token': str(self.session.token)})
        response = self.client.post(reverse('attendance-scan'), {'token': str(self.session.token)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'already_recorded')
        self.assertEqual(
            ClassAttendance.objects.filter(session=self.session, student=self.student).count(), 1
        )

    def test_scanning_closed_session_is_rejected(self):
        self.session.closed_at = self.session.opened_at
        self.session.save(update_fields=['closed_at'])
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse('attendance-scan'), {'token': str(self.session.token)})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            ClassAttendance.objects.filter(session=self.session, student=self.student).exists()
        )

    def test_scanning_malformed_token_returns_404_not_500(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse('attendance-scan'), {'token': 'not-a-uuid'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_scanning_unknown_token_returns_404(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse('attendance-scan'), {'token': '00000000-0000-0000-0000-000000000000'}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unique_together_prevents_duplicate_attendance_rows(self):
        from django.db import IntegrityError, transaction
        ClassAttendance.objects.create(session=self.session, student=self.student)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ClassAttendance.objects.create(session=self.session, student=self.student)
