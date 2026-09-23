# backend/accounts/tests.py
import datetime
import threading
import time
from unittest.mock import patch

from django.contrib.auth.tokens import default_token_generator
from django.core import signing
from django.test import TestCase, override_settings
from django.urls import reverse
from django.core.cache import cache
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import User, StudentProfile, MatricEditLevel
from .admin_whitelist import MAX_ADMINS


class UserModelTest(TestCase):
    def test_create_user_with_matric(self):
        user = User.objects.create_user(
            email='test@example.com',
            full_name='Test User',
            matric_number='23/sci03/004',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')
        # The model normalizes to the canonical uppercase form on save.
        self.assertEqual(user.matric_number, '23/SCI03/004')

    def test_create_user_without_matric(self):
        # Matric is optional at the model level (management commands, admin
        # tooling); it is the API that requires it.
        user = User.objects.create_user(
            email='test2@example.com',
            full_name='Test User 2',
            password='testpass123'
        )
        self.assertIsNone(user.matric_number)


class AuthAPITest(APITestCase):
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'surname': 'Okafor',
            'other_names': 'Chidi Emeka',
            'level': '300',
            'matric_number': '23/SCI03/004',
            'password': 'testpass123',
            'password2': 'testpass123'
        }
        # register/verify-student are throttled per IP (5/hour); don't let
        # attempts made by other tests count against this one.
        cache.clear()
        self.addCleanup(cache.clear)

    def _verification_token(self, data=None):
        """The signed token the identity-verification step hands to registration."""
        data = data or self.user_data
        return signing.dumps(
            {'email': data['email'], 'matric': data['matric_number']},
            salt='student-verification',
            compress=True,
        )

    def _register(self, **overrides):
        data = {**self.user_data, **overrides}
        data.setdefault('verification_token', self._verification_token(data))
        return self.client.post(reverse('register'), data)

    def test_register_user(self):
        response = self._register()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.matric_number, '23/SCI03/004')
        self.assertTrue(user.check_password('testpass123'))  # hashed, not stored raw

    @override_settings(EMAIL_HOST_USER='mailer@example.com', EMAIL_HOST_PASSWORD='secret')
    def test_register_does_not_wait_for_a_hanging_verification_email(self):
        # A blocked SMTP connection used to stall this request past gunicorn's
        # worker timeout (502, surfacing in the browser as a CORS error).
        sending = threading.Event()
        release = threading.Event()

        def hanging_send(user, request=None):
            sending.set()
            release.wait(5)   # simulate an SMTP connection that never answers
            return False

        try:
            with patch('accounts.views.send_verification_email', side_effect=hanging_send):
                started = time.monotonic()
                response = self._register()
                elapsed = time.monotonic() - started

                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertLess(elapsed, 3, 'register blocked on the email send')
                self.assertTrue(sending.wait(2), 'verification email was never attempted')
                self.assertTrue(User.objects.filter(email='test@example.com').exists())
        finally:
            release.set()

    def test_register_composes_full_name_from_surname_and_other_names(self):
        response = self._register(surname='  Okafor ', other_names='Chidi   Emeka')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['full_name'], 'Okafor Chidi Emeka')
        self.assertEqual(User.objects.get(email='test@example.com').full_name, 'Okafor Chidi Emeka')

    def test_register_stores_the_level_the_student_chose(self):
        self.assertEqual(self._register(level='200').status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.student_profile.level, '200')

    def test_register_requires_surname_other_names_and_level(self):
        expected = {
            'surname': 'Surname is required.',
            'other_names': 'Other names are required.',
            'level': 'Select your level.',
        }
        for field, message in expected.items():
            data = {**self.user_data}
            data.pop(field)
            data['verification_token'] = self._verification_token(data)
            response = self.client.post(reverse('register'), data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, field)
            self.assertEqual(response.data[field][0], message)
        self.assertFalse(User.objects.filter(email='test@example.com').exists())

    def test_register_rejects_an_unknown_level(self):
        for bad in ('500', '30', ''):
            response = self._register(level=bad)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, repr(bad))
            self.assertIn('100, 200, 300 or 400', response.data['level'][0])
        self.assertFalse(User.objects.filter(email='test@example.com').exists())

    def test_opening_the_profile_keeps_the_chosen_level_not_the_rosters(self):
        # The roster is last session's list, so its level must never overwrite
        # what the student told us at signup.
        from .student_service import StudentRecord
        access = self._register(level='300').data['access']
        stale_roster = StudentRecord(
            full_name='Okafor Chidi Emeka', matric_number='23/SCI03/004',
            department='Computer Science', level='200.0',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        with patch('accounts.views.verify_student_identity', return_value=stale_roster):
            response = self.client.get(reverse('student-profile'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['level'], '300')
        self.assertEqual(response.data['department'], 'Computer Science')  # still synced

    def test_verify_student_matches_the_roster_on_surname_and_other_names(self):
        from .student_service import StudentRecord
        record = StudentRecord('Okafor Chidi Emeka', '23/SCI03/004', 'Computer Science', '200.0')
        with patch('accounts.student_service.verify_student_identity', return_value=record) as verify:
            response = self.client.post(reverse('verify_student'), {
                'email': 'test@example.com',
                'surname': 'Okafor',
                'other_names': 'Chidi Emeka',
                'matric_number': '23/SCI03/004',
            })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        verify.assert_called_once_with('Okafor Chidi Emeka', '23/SCI03/004')
        self.assertTrue(response.data['verification_token'])
        # The roster's level is last session's, so it is not echoed back.
        self.assertNotIn('level', response.data['student'])

    def test_verify_student_requires_both_name_parts(self):
        response = self.client.post(reverse('verify_student'), {
            'email': 'test@example.com', 'surname': 'Okafor', 'matric_number': '23/SCI03/004',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['other_names'][0], 'Other names are required.')

    def test_register_user_without_matric(self):
        data = self.user_data.copy()
        data.pop('matric_number')
        response = self.client.post(reverse('register'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('matric_number', response.data)

    def test_register_requires_verification_token(self):
        response = self.client.post(reverse('register'), self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('verification_token', response.data)

    def test_register_lowercase_matric_explains_the_fix(self):
        response = self._register(matric_number='23/sci03/004')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        message = response.data['matric_number'][0]
        self.assertIn('capital letters', message)
        self.assertIn("'23/SCI03/004'", message)   # tells them what to type
        self.assertIn("'23/sci03/004'", message)   # ...instead of what they typed
        self.assertFalse(User.objects.filter(email='test@example.com').exists())

    def test_register_lowercase_jamb_number_explains_the_fix(self):
        response = self._register(matric_number='202330217286fa')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        message = response.data['matric_number'][0]
        self.assertIn('capital letters', message)
        self.assertIn("'202330217286FA'", message)

    def test_register_malformed_matric_gets_format_error_not_case_error(self):
        response = self._register(matric_number='not-a-matric')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        message = response.data['matric_number'][0]
        self.assertIn('23/SCI01/002', message)
        self.assertNotIn('capital letters', message)

    def test_verify_student_lowercase_matric_explains_the_fix(self):
        response = self.client.post(reverse('verify_student'), {
            'email': 'test@example.com',
            'surname': 'Okafor',
            'other_names': 'Chidi Emeka',
            'matric_number': '23/sci03/004',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        message = response.data['matric_number'][0]
        self.assertIn('capital letters', message)
        self.assertIn("'23/SCI03/004'", message)

    def test_login_user(self):
        # First register
        self.assertEqual(self._register().status_code, status.HTTP_201_CREATED)

        # Then login
        url = reverse('login')
        login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_nonexistent_email(self):
        url = reverse('login')
        response = self.client.post(url, {
            'email': 'doesnotexist@example.com', 'password': 'whatever123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertIn('sign up', response.data['email'][0].lower())

    def test_login_wrong_password(self):
        User.objects.create_user(
            email='test@example.com', full_name='Test User', password='testpass123',
        )
        response = self.client.post(reverse('login'), {
            'email': 'test@example.com', 'password': 'wrongpassword',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
        self.assertIn('incorrect', response.data['password'][0].lower())

    def test_login_deactivated_account(self):
        user = User.objects.create_user(
            email='test@example.com', full_name='Test User', password='testpass123',
        )
        user.is_active = False
        user.save()
        response = self.client.post(reverse('login'), {
            'email': 'test@example.com', 'password': 'testpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertIn('deactivated', response.data['email'][0].lower())

    def test_login_is_rate_limited_per_ip(self):
        cache.clear()
        try:
            for _ in range(10):
                response = self.client.post(reverse('login'), {
                    'email': 'nobody@example.com', 'password': 'whatever123',
                })
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

            response = self.client.post(reverse('login'), {
                'email': 'nobody@example.com', 'password': 'whatever123',
            })
            self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        finally:
            cache.clear()

    def test_password_reset_timeout_is_30_minutes(self):
        from django.conf import settings
        self.assertEqual(settings.PASSWORD_RESET_TIMEOUT, 1800)

    def test_password_reset_email_links_to_frontend_not_api_host(self):
        from django.conf import settings
        from django.core import mail

        User.objects.create_user(
            email='resetlink@example.com', full_name='Reset Link', password='oldpass123',
        )
        response = self.client.post(
            reverse('password_reset'), {'email': 'resetlink@example.com'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://nacosabuad.org')
        self.assertIn(f"{frontend_url}/reset-password?", mail.outbox[0].body)
        self.assertNotIn('testserver', mail.outbox[0].body)

    def test_password_reset_token_rejected_after_30_minutes(self):
        cache.clear()
        user = User.objects.create_user(
            email='resettest@example.com', full_name='Reset Test', password='oldpass123',
        )
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Sanity check: the token is valid right after issuance.
        self.assertTrue(default_token_generator.check_token(user, token))

        # Simulate 31 minutes passing by moving the token generator's clock
        # forward, rather than sleeping in the test.
        future = datetime.datetime.now() + datetime.timedelta(minutes=31)
        with patch.object(default_token_generator, '_now', return_value=future):
            response = self.client.post(reverse('password_reset_confirm'), {
                'uid': uid, 'token': token,
                'password': 'newpass456', 'password2': 'newpass456',
            })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expired', str(response.data).lower())

    def test_profile_access(self):
        # Register and login
        response = self._register()
        access_token = response.data['access']

        # Access profile
        url = reverse('profile')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')


class AdminUserBanTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345',
        )
        self.staff = User.objects.create_user(
            email='staff@example.com', full_name='Staff One', password='pass12345', role='admin',
        )
        self.other_staff = User.objects.create_user(
            email='staff2@example.com', full_name='Staff Two', password='pass12345', role='admin',
        )

    def test_non_admin_cannot_ban(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.patch(reverse('admin-user-ban', kwargs={'pk': self.student.pk}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_ban_and_unban_student(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(reverse('admin-user-ban', kwargs={'pk': self.student.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_active)

        response = self.client.patch(reverse('admin-user-unban', kwargs={'pk': self.student.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertTrue(self.student.is_active)

    def test_banned_student_cannot_login(self):
        self.client.force_authenticate(user=self.staff)
        self.client.patch(reverse('admin-user-ban', kwargs={'pk': self.student.pk}))

        anon_client = APIClient()
        response = anon_client.post(reverse('login'), {
            'email': 'student@example.com', 'password': 'pass12345',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cannot_ban_self(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(reverse('admin-user-ban', kwargs={'pk': self.staff.pk}))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cannot_ban_another_admin(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(reverse('admin-user-ban', kwargs={'pk': self.other_staff.pk}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_fetch_user_detail(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse('admin-user-detail', kwargs={'pk': self.student.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'student@example.com')

    def test_non_admin_cannot_fetch_user_detail(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse('admin-user-detail', kwargs={'pk': self.student.pk}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ChangePasswordTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@example.com', full_name='Some User', password='oldpass123',
        )
        self.client.force_authenticate(user=self.user)

    def test_wrong_current_password_rejected(self):
        response = self.client.post(reverse('change_password'), {
            'current_password': 'wrongpass',
            'new_password': 'newpass456',
            'new_password2': 'newpass456',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_weak_new_password_rejected(self):
        response = self.client.post(reverse('change_password'), {
            'current_password': 'oldpass123',
            'new_password': '123',
            'new_password2': '123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mismatched_new_passwords_rejected(self):
        response = self.client.post(reverse('change_password'), {
            'current_password': 'oldpass123',
            'new_password': 'newpass456',
            'new_password2': 'somethingelse789',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_successful_password_change(self):
        response = self.client.post(reverse('change_password'), {
            'current_password': 'oldpass123',
            'new_password': 'newpass456',
            'new_password2': 'newpass456',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        anon_client = APIClient()
        old_login = anon_client.post(reverse('login'), {
            'email': 'user@example.com', 'password': 'oldpass123',
        })
        self.assertEqual(old_login.status_code, status.HTTP_400_BAD_REQUEST)

        new_login = anon_client.post(reverse('login'), {
            'email': 'user@example.com', 'password': 'newpass456',
        })
        self.assertEqual(new_login.status_code, status.HTTP_200_OK)

    def test_anonymous_cannot_change_password(self):
        anon_client = APIClient()
        response = anon_client.post(reverse('change_password'), {
            'current_password': 'oldpass123',
            'new_password': 'newpass456',
            'new_password2': 'newpass456',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SuperAdminTierTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.super_admin = User.objects.create_user(
            email='super@example.com', full_name='Super Admin', password='pass12345',
            role='super_admin',
        )
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Regular Admin', password='pass12345',
            role='admin',
        )
        self.student = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345',
            matric_number='23/SCI01/077',
        )

    def test_super_admin_has_is_staff_and_is_admin(self):
        self.assertTrue(self.super_admin.is_staff)
        self.assertTrue(self.super_admin.is_admin)
        self.assertTrue(self.super_admin.is_super_admin)

    def test_regular_admin_is_not_super_admin(self):
        self.assertTrue(self.admin.is_admin)
        self.assertFalse(self.admin.is_super_admin)

    def _assign_role_url(self, target):
        return reverse('admin-user-assign-role', kwargs={'pk': target.pk})

    def test_executive_cannot_assign_roles(self):
        executive = User.objects.create_user(
            email='exec@example.com', full_name='Exec One', password='pass12345',
            role='software_director',
        )
        self.client.force_authenticate(user=executive)
        response = self.client.patch(self._assign_role_url(self.student), {'role': 'admin'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_lecturer_cannot_assign_roles(self):
        lecturer = User.objects.create_user(
            email='lecturer@example.com', full_name='Lecturer One', password='pass12345',
            role='lecturer',
        )
        self.client.force_authenticate(user=lecturer)
        response = self.client.patch(self._assign_role_url(self.student), {'role': 'admin'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_admin_can_assign_roles(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(self._assign_role_url(self.student), {'role': 'admin'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, 'admin')
        self.assertTrue(self.student.is_staff)

    def test_regular_admin_capped_at_max_admins_for_admin_tier(self):
        self.client.force_authenticate(user=self.admin)
        # self.admin already counts as 1 of the MAX_ADMINS admin-tier slots.
        for i in range(MAX_ADMINS - 1):
            candidate = User.objects.create_user(
                email=f'cand{i}@example.com', full_name=f'Candidate {i}', password='pass12345',
                matric_number=f'23/SCI01/{200 + i}',
            )
            response = self.client.patch(self._assign_role_url(candidate), {'role': 'admin'})
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.patch(self._assign_role_url(self.student), {'role': 'lecturer'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_super_admin_bypasses_admin_cap(self):
        self.client.force_authenticate(user=self.super_admin)
        for i in range(MAX_ADMINS + 2):
            candidate = User.objects.create_user(
                email=f'sacand{i}@example.com', full_name=f'SA Candidate {i}', password='pass12345',
                matric_number=f'23/SCI01/{300 + i}',
            )
            response = self.client.patch(self._assign_role_url(candidate), {'role': 'admin'})
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_change_own_role(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(self._assign_role_url(self.admin), {'role': 'student'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_change_super_admin_role(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(self._assign_role_url(self.super_admin), {'role': 'admin'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_assigning_role_approves_pending_staff(self):
        staff = User.objects.create_user(
            email='staff@example.com', full_name='Staff One', password='pass12345',
            account_type='staff', is_approved=False,
        )
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.patch(self._assign_role_url(staff), {'role': 'technician'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        staff.refresh_from_db()
        self.assertEqual(staff.role, 'technician')
        self.assertTrue(staff.is_approved)


@override_settings(
    ADMINS=[("NACOS Admin", "test-admin@example.com")],
    DEBUG=False,
    ROOT_URLCONF='nacos_backend.test_urls',
)
class AdminErrorEmailTest(TestCase):
    """
    Confirms an unhandled exception (a real bug, not a normal 400/401/403/
    404/429 that DRF already turns into a JSON response) actually reaches
    Django's AdminEmailHandler and sends mail to ADMINS.
    """

    def test_unhandled_exception_emails_admins(self):
        from django.core import mail
        from django.test import Client

        client = Client(raise_request_exception=False)
        response = client.get('/__test_crash__/')

        self.assertEqual(response.status_code, 500)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["test-admin@example.com"])
        self.assertIn("Deliberate test crash", mail.outbox[0].body)

class DeviceTokenTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='device@example.com', full_name='Device User', password='pass12345',
        )

    def test_anonymous_cannot_register_device(self):
        response = self.client.post('/api/notifications/register-device/', {
            'token': 'ExponentPushToken[abc123]', 'platform': 'ios',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_register_device(self):
        from .models import DeviceToken

        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/notifications/register-device/', {
            'token': 'ExponentPushToken[abc123]', 'platform': 'ios',
        })
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        token = DeviceToken.objects.get(token='ExponentPushToken[abc123]')
        self.assertEqual(token.user, self.user)
        self.assertEqual(token.platform, 'ios')

    def test_reregistering_same_token_reassigns_user(self):
        from .models import DeviceToken

        other_user = User.objects.create_user(
            email='other-device@example.com', full_name='Other User', password='pass12345',
        )
        DeviceToken.objects.create(user=other_user, token='ExponentPushToken[shared]', platform='android')

        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/notifications/register-device/', {
            'token': 'ExponentPushToken[shared]', 'platform': 'android',
        })
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(DeviceToken.objects.filter(token='ExponentPushToken[shared]').count(), 1)
        token = DeviceToken.objects.get(token='ExponentPushToken[shared]')
        self.assertEqual(token.user, self.user)


class PushNotificationSignalTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='push@example.com', full_name='Push User', password='pass12345',
        )

    @patch('accounts.signals.requests.post')
    def test_creating_notification_sends_push_to_registered_devices(self, mock_post):
        from .models import DeviceToken, Notification

        DeviceToken.objects.create(user=self.user, token='ExponentPushToken[xyz]', platform='ios')
        Notification.objects.create(user=self.user, title='Hello', message='World')

        mock_post.assert_called_once()
        _, kwargs = mock_post.call_args
        self.assertEqual(kwargs['json'][0]['to'], 'ExponentPushToken[xyz]')
        self.assertEqual(kwargs['json'][0]['title'], 'Hello')

    @patch('accounts.signals.requests.post')
    def test_no_push_attempted_without_registered_devices(self, mock_post):
        from .models import Notification

        Notification.objects.create(user=self.user, title='Hello', message='World')
        mock_post.assert_not_called()

    @patch('accounts.signals.requests.post', side_effect=Exception('network down'))
    def test_push_failure_does_not_raise(self, mock_post):
        from .models import DeviceToken, Notification

        DeviceToken.objects.create(user=self.user, token='ExponentPushToken[xyz]', platform='ios')
        # Should not raise even though the push call fails internally.
        Notification.objects.create(user=self.user, title='Hello', message='World')


class EmailConfigurationTest(TestCase):
    """Outgoing email goes through Resend when RESEND_API_KEY is set."""

    NO_EMAIL = dict(RESEND_API_KEY='', EMAIL_HOST_USER='', EMAIL_HOST_PASSWORD='')
    RESEND = dict(
        RESEND_API_KEY='re_test_key',
        EMAIL_BACKEND='anymail.backends.resend.EmailBackend',
        ANYMAIL={'RESEND_API_KEY': 're_test_key', 'REQUESTS_TIMEOUT': (5, 10)},
        DEFAULT_FROM_EMAIL='NACOS ABUAD <noreply@nacosabuad.org>',
    )

    def _resend_response(self):
        from unittest.mock import MagicMock
        response = MagicMock()
        response.status_code = 200
        response.content = b'{"id": "msg_123"}'
        response.json.return_value = {'id': 'msg_123'}
        return response

    def test_not_configured_without_resend_or_smtp(self):
        from .utils import email_is_configured
        with override_settings(**self.NO_EMAIL):
            self.assertFalse(email_is_configured())

    def test_configured_with_resend_key_alone(self):
        from .utils import email_is_configured
        with override_settings(**{**self.NO_EMAIL, 'RESEND_API_KEY': 're_test_key'}):
            self.assertTrue(email_is_configured())

    def test_configured_with_smtp_credentials_only(self):
        from .utils import email_is_configured
        with override_settings(**{**self.NO_EMAIL, 'EMAIL_HOST_USER': 'a@b.c', 'EMAIL_HOST_PASSWORD': 'pw'}):
            self.assertTrue(email_is_configured())

    def test_verification_email_is_sent_through_the_resend_api(self):
        from .utils import send_verification_email
        user = User.objects.create_user(
            email='student@example.com', full_name='Ada Student', password='pass12345',
        )
        with override_settings(**self.RESEND), \
                patch('requests.Session.request', return_value=self._resend_response()) as http:
            sent = send_verification_email(user)

        self.assertTrue(sent)
        self.assertEqual(http.call_count, 1)
        _, kwargs = http.call_args
        self.assertEqual(kwargs['method'].upper(), 'POST')
        self.assertEqual(kwargs['url'], 'https://api.resend.com/emails')
        self.assertEqual(kwargs['headers']['Authorization'], 'Bearer re_test_key')
        self.assertEqual(kwargs['timeout'], (5, 10))

        payload = kwargs.get('json') or __import__('json').loads(kwargs['data'])
        self.assertEqual(payload['from'], 'NACOS ABUAD <noreply@nacosabuad.org>')
        self.assertEqual(payload['to'], ['student@example.com'])
        self.assertEqual(payload['subject'], 'Verify your NACOS ABUAD account')
        self.assertIn('/verify-email/', payload['html'])

    def test_resend_api_failure_is_reported_not_raised(self):
        # A rejected send (e.g. sender domain not verified) must not crash
        # signup: send_verification_email reports False.
        from unittest.mock import MagicMock
        from .utils import send_verification_email
        user = User.objects.create_user(
            email='student2@example.com', full_name='Bola Student', password='pass12345',
        )
        rejected = MagicMock()
        rejected.status_code = 403
        rejected.content = b'{"message": "The nacosabuad.org domain is not verified."}'
        rejected.text = rejected.content.decode()
        rejected.json.return_value = {'message': 'The nacosabuad.org domain is not verified.'}
        with override_settings(**self.RESEND), \
                patch('requests.Session.request', return_value=rejected):
            self.assertFalse(send_verification_email(user))


class SeedSuperAdminTest(APITestCase):
    """`manage.py seed_super_admin` creates a super admin from env vars."""

    ENV = {
        'SUPER_ADMIN_EMAIL': 'Owner@Example.com',
        'SUPER_ADMIN_PASSWORD': 'SuperSecret!234',
        'SUPER_ADMIN_NAME': 'Site Owner',
    }

    def _seed(self, env=None, *args):
        import os
        from io import StringIO
        from django.core.management import call_command
        out, err = StringIO(), StringIO()
        clean = {k: v for k, v in os.environ.items() if not k.startswith('SUPER_ADMIN_')}
        with patch.dict(os.environ, {**clean, **(self.ENV if env is None else env)}, clear=True):
            call_command('seed_super_admin', *args, stdout=out, stderr=err)
        return out.getvalue(), err.getvalue()

    def test_creates_a_super_admin_who_can_use_the_admin_area(self):
        self._seed()
        user = User.objects.get(email='owner@example.com')
        self.assertEqual(user.role, User.Role.SUPER_ADMIN)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_email_verified)
        self.assertEqual(user.full_name, 'Site Owner')
        self.assertTrue(user.check_password('SuperSecret!234'))

    def test_skips_quietly_when_not_configured(self):
        out, _ = self._seed(env={})
        self.assertIn('skipping', out.lower())
        self.assertEqual(User.objects.count(), 0)

    def test_is_idempotent_and_never_clobbers_a_changed_password(self):
        self._seed()
        user = User.objects.get(email='owner@example.com')
        user.set_password('ChangedLater!987')
        user.save()

        out, _ = self._seed()   # e.g. the next deploy
        self.assertEqual(User.objects.filter(email='owner@example.com').count(), 1)
        self.assertIn('nothing to do', out)
        user.refresh_from_db()
        self.assertTrue(user.check_password('ChangedLater!987'))

    def test_reset_password_flag_sets_the_password(self):
        self._seed()
        user = User.objects.get(email='owner@example.com')
        user.set_password('ChangedLater!987')
        user.save()

        self._seed(None, '--reset-password')
        user.refresh_from_db()
        self.assertTrue(user.check_password('SuperSecret!234'))

    def test_promotes_an_existing_account_without_touching_its_password(self):
        existing = User.objects.create_user(
            email='owner@example.com', full_name='Existing Student', password='OriginalPass!123',
        )
        self._seed()
        existing.refresh_from_db()
        self.assertEqual(existing.role, User.Role.SUPER_ADMIN)
        self.assertTrue(existing.is_superuser)
        self.assertTrue(existing.is_staff)
        self.assertTrue(existing.check_password('OriginalPass!123'))
        self.assertEqual(existing.full_name, 'Existing Student')

    def test_weak_password_is_reported_and_skipped_without_failing(self):
        _, err = self._seed(env={**self.ENV, 'SUPER_ADMIN_PASSWORD': '123'})
        self.assertIn('not acceptable', err)
        self.assertEqual(User.objects.count(), 0)

    def test_seeded_super_admin_can_delete_a_student_record(self):
        self._seed()
        super_admin = User.objects.get(email='owner@example.com')
        student = User.objects.create_user(
            email='student@example.com', full_name='Okafor Chidi Emeka',
            matric_number='23/SCI03/004', password='pass12345',
        )
        self.client.force_authenticate(user=super_admin)
        response = self.client.delete(
            reverse('admin-user-delete', kwargs={'pk': student.pk}),
            {'matric_number': '23/SCI03/004', 'full_name': 'Okafor Chidi Emeka'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=student.pk).exists())


class MatricEditingTest(APITestCase):
    """100 level signup without matric + Super Admin matric-edit toggles."""

    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        self.super_admin = User.objects.create_user(
            email='super@example.com', full_name='Super Admin', password='pass12345',
            role='super_admin',
        )
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Regular Admin', password='pass12345',
            role='admin',
        )
        self.fresher = User.objects.create_user(
            email='fresher@example.com', full_name='Fresh Student', password='pass12345',
            role='student',
        )
        StudentProfile.objects.create(user=self.fresher, level='100')
        self.senior = User.objects.create_user(
            email='senior@example.com', full_name='Senior Student', password='pass12345',
            role='student', matric_number='22/SCI01/010',
        )
        StudentProfile.objects.create(user=self.senior, level='300')

    def _signup(self, **overrides):
        data = {
            'email': 'new@example.com', 'surname': 'Ade', 'other_names': 'Bola',
            'password': 'testpass123', 'password2': 'testpass123',
            **overrides,
        }
        return self.client.post(reverse('register'), data)

    def test_100_level_can_register_without_matric_or_token(self):
        response = self._signup(level='100')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        user = User.objects.get(email='new@example.com')
        self.assertIsNone(user.matric_number)
        self.assertEqual(user.student_profile.level, '100')

    def test_other_levels_still_require_matric(self):
        response = self._signup(level='200')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('matric_number', response.data)

    def _set_matric(self, user, value):
        user.refresh_from_db()  # real requests load the user fresh
        self.client.force_authenticate(user)
        return self.client.patch(reverse('update_matric'), {'matric_number': value})

    def test_student_cannot_edit_matric_by_default(self):
        response = self._set_matric(self.senior, '22/SCI01/011')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_per_user_toggle(self):
        self.client.force_authenticate(self.super_admin)
        url = reverse('admin-user-matric-edit', kwargs={'pk': self.senior.pk})
        self.assertEqual(self.client.patch(url, {'allowed': True}).status_code, 200)

        response = self._set_matric(self.senior, '22/SCI01/011')
        self.assertEqual(response.status_code, 200, response.data)
        self.senior.refresh_from_db()
        self.assertEqual(self.senior.matric_number, '22/SCI01/011')

        self.client.force_authenticate(self.super_admin)
        self.client.patch(url, {'allowed': False})
        self.assertEqual(self._set_matric(self.senior, '22/SCI01/012').status_code, 403)

    def test_level_toggle_opens_and_closes_whole_level(self):
        self.client.force_authenticate(self.super_admin)
        url = reverse('admin-matric-edit-levels')
        response = self.client.patch(url, {'level': '100', 'open': True})
        self.assertEqual(response.data['open_levels'], ['100'])

        self.assertEqual(self._set_matric(self.fresher, '26/SCI01/001').status_code, 200)
        # Other levels aren't affected.
        self.assertEqual(self._set_matric(self.senior, '22/SCI01/013').status_code, 403)

        self.client.force_authenticate(self.super_admin)
        response = self.client.patch(url, {'level': '100', 'open': False})
        self.assertEqual(response.data['open_levels'], [])
        self.assertEqual(self._set_matric(self.fresher, '26/SCI01/002').status_code, 403)

    def test_matric_must_be_unique_and_capitalised(self):
        self.fresher.matric_edit_allowed = True
        self.fresher.save()
        self.assertEqual(self._set_matric(self.fresher, '22/SCI01/010').status_code, 400)
        self.assertEqual(self._set_matric(self.fresher, '26/sci01/001').status_code, 400)

    def test_only_super_admin_can_toggle(self):
        self.client.force_authenticate(self.admin)
        url = reverse('admin-user-matric-edit', kwargs={'pk': self.senior.pk})
        self.assertEqual(self.client.patch(url, {'allowed': True}).status_code, 403)
        response = self.client.patch(reverse('admin-matric-edit-levels'), {'level': '100', 'open': True})
        self.assertEqual(response.status_code, 403)

    def test_profile_exposes_can_edit_matric(self):
        self.client.force_authenticate(self.fresher)
        self.assertFalse(self.client.get(reverse('profile')).data['can_edit_matric'])
        MatricEditLevel.objects.create(level='100')
        self.assertTrue(self.client.get(reverse('profile')).data['can_edit_matric'])

    def test_admin_can_delete_user_without_matric(self):
        self.client.force_authenticate(self.admin)
        url = reverse('admin-user-delete', kwargs={'pk': self.fresher.pk})
        response = self.client.delete(url, {'matric_number': '', 'full_name': 'Fresh Student'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
