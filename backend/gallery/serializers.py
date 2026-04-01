# backend/gallery/serializers.py
from rest_framework import serializers
from .models import GalleryImage


class GalleryImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(write_only=True, required=False, allow_null=True)
    image_url_field = serializers.URLField(
        source='image_url', required=False, allow_blank=True
    )
    resolved_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = GalleryImage
        fields = [
            'id',
            'image',
            'image_url_field',
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
        # Must have either an uploaded image or an external URL
        image = attrs.get('image')
        image_url = attrs.get('image_url', '')
        if not image and not image_url:
            # Allow on update if the instance already has one
            if not self.instance or (not self.instance.image and not self.instance.image_url):
                raise serializers.ValidationError(
                    'Provide either an image file or an image URL.'
                )
        return attrs

    def get_resolved_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return obj.image_url or None