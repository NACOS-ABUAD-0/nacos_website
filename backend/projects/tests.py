# backend/projects/tests.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from accounts.models import User
from .models import Project, SkillTag


class ProjectModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            full_name='Test User',
            password='testpass123'
        )
        self.skill = SkillTag.objects.create(name='Python')

    def test_create_project(self):
        project = Project.objects.create(
            owner=self.user,
            title='Test Project',
            description='Test Description'
        )
        project.tags.add(self.skill)

        self.assertEqual(project.title, 'Test Project')
        self.assertEqual(project.tags.count(), 1)
        self.assertEqual(project.owner.email, 'test@example.com')


class ProjectAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            full_name='Test User',
            password='testpass123'
        )
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            full_name='Admin User',
            password='adminpass123',
            is_staff=True
        )
        self.skill = SkillTag.objects.create(name='Python')
        self.project = Project.objects.create(
            owner=self.user,
            title='Test Project',
            description='Test Description'
        )
        self.project.tags.add(self.skill)

        self.client = APIClient()

    def test_get_skills(self):
        """Anyone can view skill tags"""
        url = reverse('skilltag-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Python')

    def test_get_projects(self):
        url = reverse('project-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_project_authenticated(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('project-list')
        data = {
            'title': 'New Project',
            'description': 'New Description',
            'tag_ids': [self.skill.id],
            'links': {'github': 'https://github.com/test/project'},
            'images': ['https://example.com/image.jpg']
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.count(), 2)

    def test_create_project_unauthenticated(self):
        url = reverse('project-list')
        data = {
            'title': 'New Project',
            'description': 'New Description'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_own_project(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('project-detail', kwargs={'pk': self.project.pk})
        data = {'title': 'Updated Title'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.title, 'Updated Title')

    def test_update_other_user_project(self):
        other_user = User.objects.create_user(
            email='other@example.com',
            full_name='Other User',
            password='otherpass123'
        )
        self.client.force_authenticate(user=other_user)
        url = reverse('project-detail', kwargs={'pk': self.project.pk})
        data = {'title': 'Hacked Title'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_any_project(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('project-detail', kwargs={'pk': self.project.pk})
        data = {'title': 'Admin Updated Title'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.title, 'Admin Updated Title')
