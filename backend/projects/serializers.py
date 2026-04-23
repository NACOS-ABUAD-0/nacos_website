# backend/projects/serializers.py
from rest_framework import serializers
from .models import Project, SkillTag, CollaborationNeed, CollaborationRequest


class SkillTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillTag
        fields = ['id', 'name', 'created_at']


class CollaborationNeedSerializer(serializers.ModelSerializer):
    skill_type_display = serializers.CharField(source='get_skill_type_display', read_only=True)

    class Meta:
        model = CollaborationNeed
        fields = ['id', 'skill_type', 'skill_type_display', 'custom_skill', 'description', 'is_filled', 'created_at']


class CollaborationRequestSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source='applicant.full_name', read_only=True)
    applicant_email = serializers.EmailField(source='applicant.email', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    need_skill = serializers.CharField(source='need.skill_type', read_only=True)

    class Meta:
        model = CollaborationRequest
        fields = [
            'id', 'project', 'project_title', 'need', 'need_skill',
            'applicant', 'applicant_name', 'applicant_email',
            'phone_number', 'message', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'applicant', 'applicant_name', 'applicant_email',
            'project_title', 'need_skill', 'status', 'created_at', 'updated_at',
            'project',  'need',

        ]


class ProjectSerializer(serializers.ModelSerializer):
    owner = serializers.SerializerMethodField()
    tags = SkillTagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=SkillTag.objects.all(),
        source='tags',
        write_only=True,
        required=False
    )
    like_count = serializers.IntegerField(read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    collaboration_needs = CollaborationNeedSerializer(many=True, read_only=True)
    collaboration_needs_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    has_collaboration_needs = serializers.BooleanField(read_only=True)

    def get_owner(self, obj):
        from accounts.serializers import UserSerializer
        return UserSerializer(obj.owner).data

    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return getattr(obj, 'is_liked_by_user', False)
        return False

    class Meta:
        model = Project
        fields = [
            'id', 'owner', 'title', 'description', 'tags', 'tag_ids',
            'images', 'links', 'created_at', 'updated_at',
            'is_featured', 'status', 'like_count', 'is_liked_by_user',
            'collaboration_needs', 'collaboration_needs_data', 'has_collaboration_needs'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def validate_links(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Links must be a dictionary")
        return value

    def validate_images(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Images must be a list")
        return value

    def create(self, validated_data):
        needs_data = validated_data.pop('collaboration_needs_data', [])
        tags_data = validated_data.pop('tags', [])
        project = Project.objects.create(**validated_data)
        project.tags.set(tags_data)

        for need in needs_data:
            CollaborationNeed.objects.create(project=project, **need)

        return project

    def update(self, instance, validated_data):
        needs_data = validated_data.pop('collaboration_needs_data', None)
        tags_data = validated_data.pop('tags', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tags_data is not None:
            instance.tags.set(tags_data)

        if needs_data is not None:
            instance.collaboration_needs.all().delete()
            for need in needs_data:
                CollaborationNeed.objects.create(project=instance, **need)

        return instance