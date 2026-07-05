import uuid

from django.db import models


class ClassSession(models.Model):
    course_code = models.CharField(max_length=20)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True,
        related_name='class_sessions_created',
    )
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-opened_at']

    @property
    def is_open(self) -> bool:
        return self.closed_at is None

    def __str__(self):
        return f"{self.course_code} @ {self.opened_at:%Y-%m-%d %H:%M}"


class ClassAttendance(models.Model):
    session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='class_attendances',
    )
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['session', 'student']
        ordering = ['-scanned_at']

    def __str__(self):
        return f"{self.student.full_name} → {self.session}"
