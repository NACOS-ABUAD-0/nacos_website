# backend/resources/serializers.py
from rest_framework import serializers
from accounts.models import User
from .models import Resource, ResourceCategory, ResourceTag


class ResourceTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceTag
        fields = ['id', 'name']


class ResourceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceCategory
        fields = ['id', 'name', 'description']


class ResourceSubmitterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name']


class ResourceSerializer(serializers.ModelSerializer):
    category = ResourceCategorySerializer(read_only=True)
    tags = ResourceTagSerializer(many=True, read_only=True)
    submitted_by = ResourceSubmitterSerializer(read_only=True)
    # Expose model helper methods as API fields.
    file_size_display = serializers.SerializerMethodField()
    file_icon = serializers.SerializerMethodField()

    def get_file_size_display(self, obj):
        return obj.get_file_size_display()

    def get_file_icon(self, obj):
        return obj.get_file_icon()

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'url', 'download_url',
            'course_code', 'year', 'category', 'tags',
            'file_type', 'file_size', 'file_size_display', 'file_icon',
            'download_count', 'is_public', 'status', 'submitted_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['download_count', 'status', 'submitted_by', 'created_at', 'updated_at']


class ResourceDetailSerializer(ResourceSerializer):
    drive_metadata = serializers.JSONField(read_only=True)

    class Meta(ResourceSerializer.Meta):
        fields = ResourceSerializer.Meta.fields + ['drive_metadata']


# Academic file types students/admins can upload as a resource.
ALLOWED_RESOURCE_MIME_TYPES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
}
MAX_RESOURCE_FILE_SIZE = 20 * 1024 * 1024  # 20MB


class ResourceSubmitSerializer(serializers.ModelSerializer):
    """
    Student-facing submission. The file itself is uploaded directly to
    Cloudinary by the client (see cloudinary_sign_resource) — this only
    records the resulting URL + metadata the client reports. That means
    file_size/file_type here are self-reported, not independently verified
    server-side (the bytes never pass through our backend) — the same
    trust model already accepted for project-image uploads in this app.
    """
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ResourceCategory.objects.all(), source='category',
        write_only=True, required=False, allow_null=True,
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=ResourceTag.objects.all(), source='tags',
        write_only=True, required=False,
    )

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'url', 'course_code', 'year',
            'category_id', 'tag_ids', 'file_type', 'file_size', 'status',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def validate_file_size(self, value):
        if value and value > MAX_RESOURCE_FILE_SIZE:
            raise serializers.ValidationError(
                f"File is too large (max {MAX_RESOURCE_FILE_SIZE // (1024 * 1024)}MB)."
            )
        return value

    def validate_file_type(self, value):
        if value not in ALLOWED_RESOURCE_MIME_TYPES:
            raise serializers.ValidationError(
                "That file type isn't supported. Allowed: PDF, Word, PowerPoint, Excel, ZIP, or plain text."
            )
        return value


class AdminResourceSerializer(serializers.ModelSerializer):
    """Full read/write serializer for admin-authored resources and moderation."""
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ResourceCategory.objects.all(), source='category',
        write_only=True, required=False, allow_null=True,
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=ResourceTag.objects.all(), source='tags',
        write_only=True, required=False,
    )
    category = ResourceCategorySerializer(read_only=True)
    tags = ResourceTagSerializer(many=True, read_only=True)
    submitted_by = ResourceSubmitterSerializer(read_only=True)

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'url', 'download_url',
            'course_code', 'year', 'category', 'category_id', 'tags', 'tag_ids',
            'file_type', 'file_size', 'is_public', 'status', 'admin_note',
            'submitted_by', 'download_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['submitted_by', 'download_count', 'created_at', 'updated_at']
