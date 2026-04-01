# backend/inquiries/models.py
from django.db import models


class Inquiry(models.Model):
    TYPE_CHOICES = [
        ('general',      'General'),
        ('sponsorship',  'Sponsorship'),
        ('partnership',  'Partnership'),
        ('recruitment',  'Recruitment'),
    ]

    STATUS_CHOICES = [
        ('new',          'New'),
        ('read',         'Read'),
        ('responded',    'Responded'),
        ('archived',     'Archived'),
    ]

    type         = models.CharField(max_length=20, choices=TYPE_CHOICES, default='general')
    name         = models.CharField(max_length=255)
    email        = models.EmailField()
    organization = models.CharField(max_length=255, blank=True)
    subject      = models.CharField(max_length=255, blank=True)
    message      = models.TextField()

    # Sponsorship-specific fields (optional on general inquiries)
    budget_range     = models.CharField(max_length=100, blank=True)
    package_interest = models.CharField(max_length=255, blank=True)
    website_url      = models.URLField(blank=True)

    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    admin_notes  = models.TextField(blank=True)

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.type}] {self.name} — {self.email}'