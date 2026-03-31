from rest_framework import serializers
from .models import Event, EventAttendance
from accounts.models import User


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            'id',
            'name',
            'start_time',
            'end_time',
            'location',
            'description',
            'registration_url',
            'contact_email',
            'is_published',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EventAttendanceSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source='student.id', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)
    student_full_name = serializers.CharField(source='student.full_name', read_only=True)
    student_matric_number = serializers.CharField(source='student.matric_number', read_only=True)
    checked_in_by_email = serializers.EmailField(source='checked_in_by.email', read_only=True)

    class Meta:
        model = EventAttendance
        fields = [
            'id',
            'event',
            'student_id',
            'student_email',
            'student_full_name',
            'student_matric_number',
            'check_in_token',
            'is_checked_in',
            'checked_in_at',
            'checked_in_by_email',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class RegisterEventAttendeeSerializer(serializers.Serializer):
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='student',
    )


class EventCheckInSerializer(serializers.Serializer):
    check_in_token = serializers.UUIDField()
