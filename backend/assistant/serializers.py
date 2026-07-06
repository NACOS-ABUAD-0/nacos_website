# backend/assistant/serializers.py

from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'created_at']
        read_only_fields = ['id', 'role', 'created_at']


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=4000, allow_blank=False)
