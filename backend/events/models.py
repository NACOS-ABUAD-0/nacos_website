# backend/events/models.py
from django.db import models
from django.utils import timezone


class Event(models.Model):
    title = models.CharField(max_length=255)          # was "name"
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=500)
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