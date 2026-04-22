# backend/committees/serializers.py


from rest_framework import serializers
from .models import Committee, CommitteeApplication
from accounts.serializers import UserSerializer


class CommitteeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Committee
        fields = ['id', 'name', 'description', 'created_at']


class CommitteeApplicationSerializer(serializers.ModelSerializer):
    committee = CommitteeSerializer(read_only=True)
    committee_id = serializers.PrimaryKeyRelatedField(
        queryset=Committee.objects.all(), source='committee', write_only=True
    )
    user = UserSerializer(read_only=True)

    class Meta:
        model = CommitteeApplication
        fields = [
            'id', 'user', 'committee', 'committee_id',
            'phone_number', 'reason', 'offer',
            'status', 'admin_note', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'user', 'committee', 'status',
            'admin_note', 'created_at', 'updated_at',
        ]


class AdminCommitteeApplicationSerializer(serializers.ModelSerializer):
    committee = CommitteeSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = CommitteeApplication
        fields = [
            'id', 'user', 'committee', 'phone_number',
            'reason', 'offer', 'status', 'admin_note',
            'created_at', 'updated_at',
        ]