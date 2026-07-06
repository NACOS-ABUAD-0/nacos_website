from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from accounts.models import User
from .models import Inquiry


class InquiryAccessControlTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Admin', password='pass12345', role='admin',
        )
        self.inquiry = Inquiry.objects.create(
            type='general', name='Jane Doe', email='jane@example.com', message='Hello there',
        )

    def test_anonymous_can_submit_inquiry(self):
        response = self.client.post('/api/inquiries/', {
            'type': 'general', 'name': 'New Visitor', 'email': 'visitor@example.com',
            'message': 'Hi!',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_anonymous_cannot_list_inquiries(self):
        response = self.client.get('/api/inquiries/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_cannot_retrieve_inquiry(self):
        response = self.client.get(f'/api/inquiries/{self.inquiry.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_cannot_update_status(self):
        response = self.client.patch(f'/api/inquiries/{self.inquiry.id}/update_status/', {
            'status': 'read',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_cannot_delete_inquiry(self):
        response = self.client.delete(f'/api/inquiries/{self.inquiry.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_list_inquiries(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/inquiries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_admin_can_update_status(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/inquiries/{self.inquiry.id}/update_status/', {
            'status': 'read',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.inquiry.refresh_from_db()
        self.assertEqual(self.inquiry.status, 'read')
