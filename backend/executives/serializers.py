from rest_framework import serializers
from .models import Executive


class ExecutiveSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Executive
        fields = [
            'id',
            'name',
            'title',
            'session',
            'level',
            'job_description',
            'email',
            'phone',
            'website',
            'linkedin_url',
            'photo_link',
            'photo_url',
            'display_order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'photo_url', 'created_at', 'updated_at']

    def get_photo_url(self, obj):
        if obj.photo_link:
            return obj.photo_link
        # Legacy uploaded file (see model note); guard because MEDIA_URL is unset.
        if obj.photo:
            try:
                return obj.photo.url
            except ValueError:
                return None
        return None
