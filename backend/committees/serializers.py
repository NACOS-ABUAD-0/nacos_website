# backend/committees/serializers.py


from rest_framework import serializers
from accounts.models import User
from .models import Committee, CommitteeApplication
from accounts.serializers import UserSerializer


class CommitteeMemberSerializer(serializers.ModelSerializer):
    """Minimal user info for a committee's leader/members — no email/matric exposed publicly."""
    class Meta:
        model = User
        fields = ['id', 'full_name']


class CommitteeSerializer(serializers.ModelSerializer):
    leader = CommitteeMemberSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()

    class Meta:
        model = Committee
        fields = ['id', 'name', 'description', 'leader', 'member_count', 'members', 'created_at']

    def get_member_count(self, obj) -> int:
        return obj.applications.filter(status='approved').count()

    def get_members(self, obj) -> list:
        approved = obj.applications.filter(status='approved').select_related('user')
        return CommitteeMemberSerializer([a.user for a in approved], many=True).data


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