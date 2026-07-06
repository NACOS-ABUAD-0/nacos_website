# backend/assistant/views.py

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Conversation, Message
from .serializers import ChatRequestSerializer, MessageSerializer
from .services import call_gemini, retrieve_context

# Only the last N messages are sent to Gemini as context — keeps token cost
# and latency bounded regardless of how long a conversation grows. Full
# history still lives in the DB for the user to scroll back through.
HISTORY_WINDOW = 20
# Caps how much history the frontend fetches on load.
DISPLAY_LIMIT = 100


class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai_assistant'

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message = serializer.validated_data['message']
        conversation, _ = Conversation.objects.get_or_create(user=request.user)

        recent = list(conversation.messages.order_by('-created_at')[:HISTORY_WINDOW])[::-1]
        history = [{"role": m.role, "content": m.content} for m in recent]

        Message.objects.create(conversation=conversation, role=Message.Role.USER, content=user_message)

        context = retrieve_context(user_message)
        reply_text = call_gemini(history, user_message, context)

        reply = Message.objects.create(
            conversation=conversation, role=Message.Role.ASSISTANT, content=reply_text,
        )
        return Response(MessageSerializer(reply).data, status=status.HTTP_201_CREATED)


class MessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        conversation = Conversation.objects.filter(user=request.user).first()
        if not conversation:
            return Response([])
        messages = conversation.messages.order_by('-created_at')[:DISPLAY_LIMIT]
        return Response(MessageSerializer(reversed(list(messages)), many=True).data)


class ClearConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Conversation.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
