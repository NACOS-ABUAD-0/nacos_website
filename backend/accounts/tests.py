# backend/accounts/tests.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
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