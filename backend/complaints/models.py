# backend/complaints/models.py

from django.db import models
from accounts.models import User


class Complaint(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', 'New'
        IN_PROGRESS = 'in_progress', 'In Progress'
        RESOLVED = 'resolved', 'Resolved'
        DISMISSED = 'dismissed', 'Dismissed'

    # Null whenever is_anonymous=True — deliberately not just hidden from
    # admins, but never written to the database at all, so an anonymous
    # complaint genuinely cannot be traced back to its submitter.
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='complaints',
    )
    is_anonymous = models.BooleanField(default=False)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEW, db_index=True,
    )
    admin_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        who = 'Anonymous' if self.is_anonymous else (self.user.full_name if self.user else 'Unknown')
        return f"[{self.status}] {self.subject} — {who}"
