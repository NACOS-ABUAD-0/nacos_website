from unittest.mock import Mock, patch

from django.conf import settings
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from accounts.models import User
from projects.models import Project, SkillTag
from resources.models import Resource, ResourceTag
from .models import Conversation, Message
from .services import BUSY_REPLY, FALLBACK_REPLY, call_assistant, retrieve_context


class AssistantChatAccessControlTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345',
        )

    def test_anonymous_cannot_chat(self):
        response = self.client.post('/api/assistant/chat/', {'message': 'hello'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('assistant.views.call_assistant', return_value='Mocked reply.')
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

    @patch('assistant.views.call_assistant', return_value='Second reply.')
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

    @patch('assistant.views.call_assistant', return_value='Reply.')
    def test_messages_endpoint_returns_history(self, mock_call):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/assistant/chat/', {'message': 'Hello'})
        response = self.client.get('/api/assistant/messages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    @patch('assistant.views.call_assistant', return_value='Reply.')
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

    def test_finds_project_from_full_sentence_query_via_keyword_extraction(self):
        # Regression test for the exact bug reported: a full natural-sentence
        # question never matched anything because the whole sentence was
        # used as one literal `icontains` substring.
        Project.objects.create(
            owner=self.owner, title='Campus Marketplace', description='A finance app.',
            status='published', live_url='https://marketplace.example.com',
        )
        context = retrieve_context('is there any project on the site about a marketplace?')
        self.assertIn('Campus Marketplace', context)

    def test_finds_project_by_exact_tag_name_not_in_title_or_description(self):
        # 'React' is pre-seeded by projects/migrations/0002_seed_skills.py.
        tag, _ = SkillTag.objects.get_or_create(name='React')
        project = Project.objects.create(
            owner=self.owner, title='Quantora', description='A finance app.',
            status='published', live_url='https://quantora.online',
        )
        project.tags.add(tag)
        context = retrieve_context('was there any project that had react or tailwind as a tech stack')
        self.assertIn('Quantora', context)

    def test_pending_resource_excluded_from_context(self):
        Resource.objects.create(
            title='Pending Notes', description='Not yet approved.',
            url='https://drive.google.com/2', file_type='pdf', drive_file_id='pending1',
            status=Resource.Status.PENDING,
        )
        context = retrieve_context('pending notes')
        self.assertNotIn('Pending Notes', context)

    def test_rejected_resource_excluded_from_context(self):
        Resource.objects.create(
            title='Rejected Notes', description='Was rejected.',
            url='https://drive.google.com/3', file_type='pdf', drive_file_id='rejected1',
            status=Resource.Status.REJECTED,
        )
        context = retrieve_context('rejected notes')
        self.assertNotIn('Rejected Notes', context)

    def test_finds_resource_by_exact_tag_name(self):
        tag = ResourceTag.objects.create(name='Algorithms')
        resource = Resource.objects.create(
            title='CSC301 Notes', description='Course material.',
            url='https://drive.google.com/4', file_type='pdf', drive_file_id='tagged1',
        )
        resource.tags.add(tag)
        context = retrieve_context('do you have anything on algorithms')
        self.assertIn('CSC301 Notes', context)


@override_settings(GROQ_API_KEY='test-secret-key', GROQ_MODEL='test-model')
class CallAssistantTests(TestCase):
    def setUp(self):
        cache.clear()

    def _response(self, status_code, body):
        response = Mock(status_code=status_code, ok=status_code < 400, text=str(body))
        response.json.return_value = body
        return response

    @patch('assistant.services.requests.post')
    def test_returns_reply_and_sends_history_in_openai_format(self, mock_post):
        mock_post.return_value = self._response(200, {'choices': [{'message': {'role': 'assistant', 'content': 'Hello!'}}]})
        history = [{'role': 'user', 'content': 'earlier'}, {'role': 'assistant', 'content': 'earlier reply'}]
        self.assertEqual(call_assistant(history, 'hi', 'CONTEXT'), 'Hello!')
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], 'https://api.groq.com/openai/v1/chat/completions')
        self.assertEqual(kwargs['headers'], {'Authorization': 'Bearer test-secret-key'})
        body = kwargs['json']
        self.assertEqual(body['model'], 'test-model')
        self.assertEqual([m['role'] for m in body['messages']], ['system', 'user', 'assistant', 'user'])
        self.assertIn('CONTEXT', body['messages'][0]['content'])
        self.assertEqual(body['messages'][-1]['content'], 'hi')

    @patch('assistant.services.requests.post')
    def test_refusal_logs_reason_without_key_and_falls_back(self, mock_post):
        mock_post.return_value = self._response(401, {'error': {
            'message': 'Invalid API Key', 'type': 'invalid_request_error', 'code': 'invalid_api_key',
        }})
        with self.assertLogs('assistant.services', level='WARNING') as logs:
            self.assertEqual(call_assistant([], 'hi', ''), FALLBACK_REPLY)
        output = '\n'.join(logs.output)
        self.assertIn('HTTP 401 invalid_api_key: Invalid API Key', output)
        self.assertNotIn('test-secret-key', output)

    @patch('assistant.services.requests.post')
    def test_rate_limit_gives_busy_reply(self, mock_post):
        mock_post.return_value = self._response(429, {'error': {'message': 'Rate limit reached', 'code': 'rate_limit_exceeded'}})
        with self.assertLogs('assistant.services', level='WARNING'):
            self.assertEqual(call_assistant([], 'hi', ''), BUSY_REPLY)

    @override_settings(GROQ_API_KEY='')
    def test_missing_key_says_not_set_up(self):
        self.assertIn("isn't set up", call_assistant([], 'hi', ''))
