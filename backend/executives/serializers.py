from rest_framework import serializers
from .models import Executive


class ExecutiveSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(write_only=True, required=False, allow_null=True)
    photo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Executive
        fields = [
            'id',
            'name',
            'title',
            'job_description',
            'email',
            'phone',
            'website',
            'linkedin_url',
            'photo',
            'photo_url',
            'display_order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'photo_url', 'created_at', 'updated_at']

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        request = self.context.get('request')
        url = obj.photo.url
        if request:
            return request.build_absolute_uri(url)
        return url
