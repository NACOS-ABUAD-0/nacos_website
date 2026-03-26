from rest_framework import serializers
from .models import GalleryImage


class GalleryImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(write_only=True, required=False, allow_null=True)
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = GalleryImage
        fields = [
            'id',
            'image',
            'image_url',
            'caption',
            'alt_text',
            'display_order',
            'is_published',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'image_url', 'created_at', 'updated_at']

    def create(self, validated_data):
        if not validated_data.get('image'):
            raise serializers.ValidationError({'image': 'This field is required when creating a gallery image.'})
        return super().create(validated_data)

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url
