# backend/events/models.py
import uuid

from django.db import models
from django.utils import timezone


class Event(models.Model):
    title = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=500, blank=True, default="")  # blank=True + default for remote events
    is_remote = models.BooleanField(default=False)
    poster_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    registration_url = models.URLField(blank=True)
    contact_email = models.EmailField(blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return self.title

    @property
    def status(self):
        now = timezone.now()
        if now < self.start_time:
            return 'upcoming'
        if self.end_time and now <= self.end_time:
            return 'ongoing'
        return 'completed'


class EventRegistration(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='event_registrations')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='event_checkins_performed',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['event', 'user']
        ordering = ['-created_at']
        indexes = [models.Index(fields=['event', 'checked_in_at'])]

    @property
    def is_checked_in(self) -> bool:
        return self.checked_in_at is not None

    def __str__(self):
        return f"{self.user.full_name} → {self.event.title}"