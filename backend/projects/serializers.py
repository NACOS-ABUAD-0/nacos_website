# backend/projects/serializers.py
from rest_framework import serializers
from .models import Project, SkillTag
from accounts.serializers import UserSerializer


class SkillTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillTag
        fields = ['id', 'name', 'created_at']


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    tags = SkillTagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=SkillTag.objects.all(),
        source='tags',
        write_only=True,
        required=False
    )

    class Meta:
        model = Project
        fields = [
            'id', 'owner', 'title', 'description', 'tags', 'tag_ids',
            'images', 'links', 'created_at', 'updated_at',
            'is_featured', 'status'
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
        tags_data = validated_data.pop('tags', [])
        project = Project.objects.create(**validated_data)
        project.tags.set(tags_data)
        return project

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if tags_data is not None:
            instance.tags.set(tags_data)

        return instance
