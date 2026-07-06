from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from accounts.models import User
from .models import Committee, CommitteeApplication


class CommitteeLeaderMembersTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.committee = Committee.objects.create(
            name='Test Committee', description='A committee for testing.',
        )
        self.leader = User.objects.create_user(
            email='leader@example.com', full_name='Leader Person', password='pass12345',
        )
        self.member = User.objects.create_user(
            email='member@example.com', full_name='Member Person', password='pass12345',
        )
        self.pending_applicant = User.objects.create_user(
            email='pending@example.com', full_name='Pending Person', password='pass12345',
        )

    def test_committee_with_no_leader_and_no_members(self):
        response = self.client.get('/api/committees/')
        data = next(c for c in response.data['results'] if c['id'] == self.committee.id)
        self.assertIsNone(data['leader'])
        self.assertEqual(data['member_count'], 0)
        self.assertEqual(data['members'], [])

    def test_leader_is_shown_once_assigned(self):
        self.committee.leader = self.leader
        self.committee.save()
        response = self.client.get('/api/committees/')
        data = next(c for c in response.data['results'] if c['id'] == self.committee.id)
        self.assertEqual(data['leader']['full_name'], 'Leader Person')

    def test_only_approved_applications_count_as_members(self):
        CommitteeApplication.objects.create(
            user=self.member, committee=self.committee,
            phone_number='08000000000', reason='r', offer='o',
            status=CommitteeApplication.Status.APPROVED,
        )
        CommitteeApplication.objects.create(
            user=self.pending_applicant, committee=self.committee,
            phone_number='08000000001', reason='r', offer='o',
            status=CommitteeApplication.Status.PENDING,
        )
        response = self.client.get('/api/committees/')
        data = next(c for c in response.data['results'] if c['id'] == self.committee.id)
        self.assertEqual(data['member_count'], 1)
        self.assertEqual(data['members'], [{'id': self.member.id, 'full_name': 'Member Person'}])
