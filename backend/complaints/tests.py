from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from accounts.models import User
from .models import Complaint


class ComplaintAccessControlTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345',
        )
        self.other_user = User.objects.create_user(
            email='other@example.com', full_name='Student Two', password='pass12345',
        )
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Admin', password='pass12345', role='admin',
        )

    def test_anonymous_request_cannot_submit(self):
        response = self.client.post('/api/complaints/', {
            'subject': 'Broken tap', 'message': 'The tap in the lab is broken.',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_anonymous_complaint_stores_the_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/complaints/', {
            'subject': 'Broken tap', 'message': 'The tap in the lab is broken.',
            'is_anonymous': False,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        complaint = Complaint.objects.get(id=response.data['id'])
        self.assertEqual(complaint.user, self.user)

    def test_anonymous_complaint_never_stores_the_user(self):
        """The core guarantee: even though the request is authenticated,
        choosing anonymous must leave `user` null in the database — not
        just hidden from serializer output."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/complaints/', {
            'subject': 'Harassment concern', 'message': 'Reporting an issue.',
            'is_anonymous': True,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        complaint = Complaint.objects.get(id=response.data['id'])
        self.assertIsNone(complaint.user)
        self.assertTrue(complaint.is_anonymous)
        # Also never exposed back in the API response.
        self.assertNotIn('user', response.data)

    def test_anonymous_complaint_does_not_appear_in_my_complaints(self):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/complaints/', {
            'subject': 'Anon issue', 'message': 'msg', 'is_anonymous': True,
        })
        response = self.client.get('/api/complaints/my-complaints/')
        self.assertEqual(response.data, [])

    def test_user_only_sees_own_complaints(self):
        Complaint.objects.create(user=self.other_user, subject='Not yours', message='msg')
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/complaints/my-complaints/')
        self.assertEqual(response.data, [])

    def test_non_admin_cannot_list_admin_complaints(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/admin/complaints/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_and_see_anonymous_flag(self):
        Complaint.objects.create(user=None, is_anonymous=True, subject='Anon', message='msg')
        Complaint.objects.create(user=self.user, subject='Named', message='msg')
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/complaints/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        anon_entry = next(c for c in response.data['results'] if c['is_anonymous'])
        self.assertIsNone(anon_entry['user'])

    def test_admin_can_update_status(self):
        complaint = Complaint.objects.create(user=self.user, subject='Issue', message='msg')
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/admin/complaints/{complaint.id}/update-status/', {
            'status': 'resolved', 'admin_note': 'Fixed it.',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        complaint.refresh_from_db()
        self.assertEqual(complaint.status, 'resolved')
        self.assertEqual(complaint.admin_note, 'Fixed it.')
