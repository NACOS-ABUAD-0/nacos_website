# backend/resources/serializers.py
from rest_framework import serializers
from .models import Resource, ResourceCategory, ResourceTag


class ResourceTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceTag
        fields = ['id', 'name']


class ResourceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceCategory
        fields = ['id', 'name', 'description']


class ResourceSerializer(serializers.ModelSerializer):
    category = ResourceCategorySerializer(read_only=True)
    tags = ResourceTagSerializer(many=True, read_only=True)
    file_size_display = serializers.ReadOnlyField()
    file_icon = serializers.ReadOnlyField()

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'url', 'download_url',
            'course_code', 'year', 'category', 'tags',
            'file_type', 'file_size', 'file_size_display', 'file_icon',
            'download_count', 'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = ['download_count', 'created_at', 'updated_at']


class ResourceDetailSerializer(ResourceSerializer):
    drive_metadata = serializers.JSONField(read_only=True)

    class Meta(ResourceSerializer.Meta):
        fields = ResourceSerializer.Meta.fields + ['drive_metadata']