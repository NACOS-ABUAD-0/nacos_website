# backend/committees/models.py

from django.db import models
from accounts.models import User


class Committee(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    leader = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='led_committees',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class CommitteeApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='committee_applications'
    )
    committee = models.ForeignKey(
        Committee, on_delete=models.CASCADE, related_name='applications'
    )
    phone_number = models.CharField(max_length=20)
    reason = models.TextField()
    offer = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    admin_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'committee']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.full_name} → {self.committee.name}"