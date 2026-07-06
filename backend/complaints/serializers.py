# backend/complaints/serializers.py

from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import Complaint


class ComplaintSerializer(serializers.ModelSerializer):
    """
    User-facing: submit + view your own complaints. Deliberately never
    exposes `user` — the anonymity guarantee is enforced server-side in
    the view (perform_create), not here.
    """
    class Meta:
        model = Complaint
        fields = ['id', 'subject', 'message', 'is_anonymous', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']


class AdminComplaintSerializer(serializers.ModelSerializer):
    """Full serializer for admins — user is null whenever is_anonymous=True."""
    user = UserSerializer(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'user', 'is_anonymous', 'subject', 'message',
            'status', 'admin_note', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'is_anonymous', 'subject', 'message', 'created_at', 'updated_at']
