# backend/accounts/tests.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import User


class UserModelTest(TestCase):
    def test_create_user_with_matric(self):
        user = User.objects.create_user(
            email='test@example.com',
            full_name='Test User',
            matric_number='23/sci03/004',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.matric_number, '23/sci03/004')

    def test_create_user_without_matric(self):
        user = User.objects.create_user(
            email='test2@example.com',
            full_name='Test User 2',
            password='testpass123'
        )
        self.assertTrue(user.matric_number.startswith('TEMP-'))


class AuthAPITest(APITestCase):
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'full_name': 'Test User',
            'matric_number': '23/sci03/004',
            'password': 'testpass123',
            'password2': 'testpass123'
        }

    def test_register_user(self):
        url = reverse('register')
        response = self.client.post(url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_register_user_without_matric(self):
        data = self.user_data.copy()
        data.pop('matric_number')
        url = reverse('register')
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['user']['matric_number'].startswith('TEMP-'))

    def test_login_user(self):
        # First register
        url = reverse('register')
        self.client.post(url, self.user_data)

        # Then login
        url = reverse('login')
        login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_profile_access(self):
        # Register and login
        url = reverse('register')
        response = self.client.post(url, self.user_data)
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

    def test_regular_admin_cannot_promote_users(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(reverse('admin-role-assign'), {
            'matric_number': self.student.matric_number,
            'full_name': self.student.full_name,
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_admin_cannot_revoke_admins(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(reverse('admin-role-revoke'), {
            'matric_number': self.student.matric_number,
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_admin_cannot_view_admin_list(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('admin-list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_super_admin_can_promote_and_revoke(self):
        self.client.force_authenticate(user=self.super_admin)

        promote = self.client.post(reverse('admin-role-assign'), {
            'matric_number': self.student.matric_number,
            'full_name': self.student.full_name,
        })
        self.assertEqual(promote.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, 'admin')
        self.assertTrue(self.student.is_staff)

        revoke = self.client.delete(reverse('admin-role-revoke'), {
            'matric_number': self.student.matric_number,
        })
        self.assertEqual(revoke.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, 'user')
        self.assertFalse(self.student.is_staff)

    def test_super_admin_list_includes_both_tiers(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get(reverse('admin-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = {a['email'] for a in response.data['admins']}
        self.assertIn('super@example.com', emails)
        self.assertIn('admin@example.com', emails)
        # MAX_ADMINS count/slots only reflect the regular ADMIN tier.
        self.assertEqual(response.data['count'], 1)