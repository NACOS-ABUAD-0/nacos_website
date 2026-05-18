from rest_framework import serializers
from .models import GalleryImage


class GalleryImageSerializer(serializers.ModelSerializer):
    resolved_url = serializers.ReadOnlyField()

    class Meta:
        model = GalleryImage
        fields = [
            'id',
            'image_url',
            'resolved_url',
            'caption',
            'alt_text',
            'category',
            'display_order',
            'is_published',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'resolved_url', 'created_at', 'updated_at']

    def validate(self, attrs):
        if not attrs.get('image_url'):
            raise serializers.ValidationError(
                {'image_url': 'An image URL is required.'}
            )
        return attrs