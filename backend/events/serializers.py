# backend/events/serializers.py
from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()       # computed @property
    media = serializers.SerializerMethodField()

    # `location` is optional for remote events — allow empty string so the
    # frontend can submit "" without getting a 400 validation error.
    location = serializers.CharField(required=False, allow_blank=True, default="")

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

    def validate(self, attrs):
        # If the event is not remote, location must be provided.
        is_remote = attrs.get('is_remote', getattr(self.instance, 'is_remote', False))
        location = attrs.get('location', getattr(self.instance, 'location', ''))

        if not is_remote and not location:
            raise serializers.ValidationError(
                {'location': 'Location is required for in-person events.'}
            )

        return attrs