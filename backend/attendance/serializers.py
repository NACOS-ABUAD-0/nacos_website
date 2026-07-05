from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import ClassAttendance, ClassSession


class ClassAttendanceSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)

    class Meta:
        model = ClassAttendance
        fields = ['id', 'student', 'scanned_at']
        read_only_fields = fields


class ClassSessionSerializer(serializers.ModelSerializer):
    is_open = serializers.ReadOnlyField()
    attendee_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassSession
        fields = ['id', 'course_code', 'token', 'opened_at', 'closed_at', 'is_open', 'attendee_count']
        read_only_fields = ['id', 'token', 'opened_at', 'closed_at', 'is_open', 'attendee_count']

    def get_attendee_count(self, obj):
        return obj.attendances.count()


class ClassSessionDetailSerializer(ClassSessionSerializer):
    attendances = ClassAttendanceSerializer(many=True, read_only=True)

    class Meta(ClassSessionSerializer.Meta):
        fields = ClassSessionSerializer.Meta.fields + ['attendances']
