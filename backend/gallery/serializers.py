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

    def validate_image_url(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError('An image URL is required.')
        url = str(value).strip()
        if len(url) > 2048:
            raise serializers.ValidationError(
                'Image URL is too long (max 2048 characters). Use a shorter link or upload to Cloudinary.'
            )
        return url

    def validate(self, attrs):
        if self.instance is None and not attrs.get('image_url'):
            raise serializers.ValidationError(
                {'image_url': 'An image URL is required.'}
            )
        if self.instance is not None and 'image_url' in attrs and not attrs['image_url']:
            raise serializers.ValidationError(
                {'image_url': 'An image URL is required.'}
            )
        return attrs