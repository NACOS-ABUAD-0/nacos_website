from unittest.mock import patch

from django.conf import settings
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from accounts.models import User
from projects.models import Project
from resources.models import Resource
from .models import Conversation, Message
from .services import retrieve_context


class AssistantChatAccessControlTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345',
        )

    def test_anonymous_cannot_chat(self):
        response = self.client.post('/api/assistant/chat/', {'message': 'hello'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('assistant.views.call_gemini', return_value='Mocked reply.')
    def test_authenticated_chat_stores_both_messages(self, mock_call):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/assistant/chat/', {'message': 'Hi there'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Mocked reply.')
        self.assertEqual(response.data['role'], 'assistant')

        conversation = Conversation.objects.get(user=self.user)
        messages = list(conversation.messages.order_by('created_at'))
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0].role, 'user')
        self.assertEqual(messages[0].content, 'Hi there')
        self.assertEqual(messages[1].role, 'assistant')
        self.assertEqual(messages[1].content, 'Mocked reply.')

    @patch('assistant.views.call_gemini', return_value='Second reply.')
    def test_conversation_context_grows_across_calls(self, mock_call):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/assistant/chat/', {'message': 'First message'})
        self.client.post('/api/assistant/chat/', {'message': 'Second message'})

        conversation = Conversation.objects.get(user=self.user)
        self.assertEqual(conversation.messages.count(), 4)

        # The second call's history argument should include the first exchange.
        second_call_history = mock_call.call_args_list[1][0][0]
        contents = [m['content'] for m in second_call_history]
        self.assertIn('First message', contents)

    @patch('assistant.views.call_gemini', return_value='Reply.')
    def test_messages_endpoint_returns_history(self, mock_call):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/assistant/chat/', {'message': 'Hello'})
        response = self.client.get('/api/assistant/messages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    @patch('assistant.views.call_gemini', return_value='Reply.')
    def test_clear_conversation_empties_history(self, mock_call):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/assistant/chat/', {'message': 'Hello'})
        response = self.client.post('/api/assistant/clear/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Conversation.objects.filter(user=self.user).exists())

        response = self.client.get('/api/assistant/messages/')
        self.assertEqual(response.data, [])

    def test_blank_message_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/assistant/chat/', {'message': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_throttle_scope_is_configured(self):
        self.assertIn('ai_assistant', settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])


class RetrieveContextTest(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner@example.com', full_name='Project Owner', password='pass12345',
        )

    def test_finds_matching_resource(self):
        Resource.objects.create(
            title='Data Structures Notes', description='Covers trees and graphs.',
            url='https://drive.google.com/1', file_type='pdf', drive_file_id='abc123',
        )
        context = retrieve_context('data structures')
        self.assertIn('Data Structures Notes', context)

    def test_finds_matching_published_project(self):
        Project.objects.create(
            owner=self.owner, title='Quantora', description='A finance app.',
            status='published', live_url='https://quantora.online',
        )
        context = retrieve_context('quantora')
        self.assertIn('Quantora', context)
        self.assertIn('quantora.online', context)

    def test_ignores_draft_projects(self):
        Project.objects.create(
            owner=self.owner, title='SecretDraft', description='not public',
            status='draft', live_url='https://example.com',
        )
        context = retrieve_context('SecretDraft')
        self.assertNotIn('SecretDraft', context)

    def test_no_matches_returns_empty_string(self):
        context = retrieve_context('zzz_nonexistent_query_zzz')
        self.assertEqual(context, '')
