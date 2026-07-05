# backend/projects/models.py

from django.db import models
from accounts.models import User


class SkillTag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Project(models.Model):
    STATUS_CHOICES = [('draft', 'Draft'), ('published', 'Published')]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=255)
    description = models.TextField()
    tags = models.ManyToManyField(SkillTag, blank=True)
    images = models.JSONField(default=list, blank=True)
    links = models.JSONField(default=dict, blank=True)
    # Required at the serializer layer (see ProjectSerializer) so every
    # published project has somewhere for visitors to see it running live,
    # not just source code. Kept blank=True here at the model/DB level to
    # avoid a NOT-NULL migration against existing rows.
    live_url = models.URLField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_featured = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='published',
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def has_collaboration_needs(self):
        return self.collaboration_needs.filter(is_filled=False).exists()

    @property
    def open_collaboration_needs(self):
        return self.collaboration_needs.filter(is_filled=False)


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_likes')
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'project')

    def __str__(self):
        return f"{self.user} likes {self.project}"


# ─── Collaboration System ─────────────────────────────────────────────────────

class CollaborationNeed(models.Model):
    SKILL_CHOICES = [
        ('frontend', 'Frontend'),
        ('backend', 'Backend'),
        ('ui_ux', 'UI/UX'),
        ('ai_ml', 'AI/ML'),
        ('documentation', 'Documentation'),
        ('others', 'Others'),
    ]

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name='collaboration_needs'
    )
    skill_type = models.CharField(max_length=20, choices=SKILL_CHOICES)
    custom_skill = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    is_filled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project.title} needs {self.get_skill_type_display()}"


class CollaborationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name='collaboration_requests'
    )
    # BUG FIX: Changed on_delete from CASCADE to SET_NULL.
    # Previously, when serializer.update() rebuilt collaboration_needs
    # (delete-all + recreate), it cascade-deleted every linked request.
    need = models.ForeignKey(
        CollaborationNeed,
        on_delete=models.SET_NULL,
        related_name='requests',
        null=True,
        blank=True,
    )
    applicant = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='collaboration_requests'
    )
    phone_number = models.CharField(max_length=20)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # BUG 1 & 4 ROOT CAUSE FIX:
        # Must be (project, applicant) — NOT just (applicant,).
        # A single user must be allowed to apply to MULTIPLE different projects.
        # If the DB currently has unique_together=('applicant',), run the
        # 0002_fix_collaboration_constraints migration to correct it.
        unique_together = ('project', 'applicant')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.applicant.full_name} → {self.project.title}"