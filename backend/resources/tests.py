from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from accounts.models import User
from .models import Resource


class ResourceSubmissionTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345',
        )
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Admin', password='pass12345', role='admin',
        )

    def test_anonymous_cannot_submit(self):
        response = self.client.post('/api/resources/submit/', {
            'title': 'Past Questions', 'url': 'https://res.cloudinary.com/demo/raw/upload/v1/x.pdf',
            'file_type': 'application/pdf', 'file_size': 1000,
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_submission_starts_pending(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/resources/submit/', {
            'title': 'Past Questions', 'url': 'https://res.cloudinary.com/demo/raw/upload/v1/x.pdf',
            'file_type': 'application/pdf', 'file_size': 1000,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        resource = Resource.objects.get(id=response.data['id'])
        self.assertEqual(resource.status, Resource.Status.PENDING)
        self.assertEqual(resource.submitted_by, self.user)

    def test_pending_submission_not_in_public_list(self):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/resources/submit/', {
            'title': 'Pending Resource', 'url': 'https://res.cloudinary.com/demo/raw/upload/v1/x.pdf',
            'file_type': 'application/pdf', 'file_size': 1000,
        })
        response = self.client.get('/api/resources/')
        titles = [r['title'] for r in response.data['results']]
        self.assertNotIn('Pending Resource', titles)

    def test_oversized_file_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/resources/submit/', {
            'title': 'Huge File', 'url': 'https://res.cloudinary.com/demo/raw/upload/v1/x.pdf',
            'file_type': 'application/pdf', 'file_size': 50 * 1024 * 1024,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file_size', response.data)

    def test_disallowed_file_type_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/resources/submit/', {
            'title': 'Executable', 'url': 'https://res.cloudinary.com/demo/raw/upload/v1/x.exe',
            'file_type': 'application/x-msdownload', 'file_size': 1000,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file_type', response.data)

    def test_non_admin_cannot_list_admin_resources(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/admin/resources/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_approve_submission(self):
        self.client.force_authenticate(user=self.user)
        submit_response = self.client.post('/api/resources/submit/', {
            'title': 'Needs Approval', 'url': 'https://res.cloudinary.com/demo/raw/upload/v1/x.pdf',
            'file_type': 'application/pdf', 'file_size': 1000,
        })
        resource_id = submit_response.data['id']

        self.client.force_authenticate(user=self.admin)
        approve_response = self.client.patch(f'/api/admin/resources/{resource_id}/approve/')
        self.assertEqual(approve_response.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_response.data['status'], 'approved')

        # Now visible in the public list.
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/resources/')
        titles = [r['title'] for r in response.data['results']]
        self.assertIn('Needs Approval', titles)

    def test_admin_can_reject_submission(self):
        self.client.force_authenticate(user=self.user)
        submit_response = self.client.post('/api/resources/submit/', {
            'title': 'Bad Submission', 'url': 'https://res.cloudinary.com/demo/raw/upload/v1/x.pdf',
            'file_type': 'application/pdf', 'file_size': 1000,
        })
        resource_id = submit_response.data['id']

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/admin/resources/{resource_id}/reject/', {
            'admin_note': 'Duplicate of an existing resource.',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'rejected')
        self.assertEqual(response.data['admin_note'], 'Duplicate of an existing resource.')

    def test_admin_created_resource_is_approved_immediately(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/admin/resources/', {
            'title': 'Admin Resource', 'url': 'https://drive.google.com/file/d/abc/view',
            'file_type': 'application/pdf',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'approved')
        self.assertIsNone(response.data['submitted_by'])

    def test_file_size_display_does_not_mutate_stored_value(self):
        resource = Resource.objects.create(
            title='Test', url='https://example.com/x.pdf', file_type='application/pdf',
            file_size=2048, drive_file_id='test-1',
        )
        display = resource.get_file_size_display()
        self.assertEqual(display, '2.0 KB')
        self.assertEqual(resource.file_size, 2048)
