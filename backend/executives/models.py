import re

from django.core.exceptions import ValidationError
from django.db import models

SESSION_RE = re.compile(r'^(\d{2})/(\d{2})$')


def validate_session(value):
    """Sessions are written "YY/YY" with consecutive years, e.g. "26/27"."""
    match = SESSION_RE.match(value or '')
    if not match:
        raise ValidationError('Session must look like "26/27".')
    start, end = int(match.group(1)), int(match.group(2))
    if (start + 1) % 100 != end:
        raise ValidationError('Session years must be consecutive, e.g. "26/27".')


def validate_photo_link(value):
    """Only https:// URLs or site-relative /images/... paths are accepted."""
    if value and not (value.startswith('https://') or value.startswith('/images/')):
        raise ValidationError('Photo must be an https:// URL or a /images/... site path.')


class Executive(models.Model):
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255, help_text='Executive office or role title')
    session = models.CharField(
        max_length=5,
        db_index=True,
        validators=[validate_session],
        help_text='Administration session, e.g. 26/27',
    )
    level = models.CharField(
        max_length=100,
        blank=True,
        help_text='e.g. Computer Science 400 Level',
    )
    job_description = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    website = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    # Photo shown publicly: a full https:// URL (Cloudinary, uploaded from the
    # admin panel) or a site path such as /images/executives/2026-2027/x.png.
    photo_link = models.CharField(max_length=2048, blank=True, validators=[validate_photo_link])
    # Legacy upload field, no longer written to (MEDIA_ROOT/MEDIA_URL are not
    # configured, so file uploads never worked). Kept only so old rows still read.
    photo = models.ImageField(upload_to='executives/', blank=True, null=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name_plural = 'Executives'

    def __str__(self):
        return f'{self.name} ({self.title})'
