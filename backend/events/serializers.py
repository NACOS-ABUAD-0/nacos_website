# backend/events/serializers.py
from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()       # computed @property
    media = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'start_time', 'end_time',
            'location', 'is_remote', 'poster_url',
            'description', 'registration_url', 'contact_email',
            'is_published', 'status', 'media',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def get_media(self, obj):
        return {'poster': obj.poster_url or None}