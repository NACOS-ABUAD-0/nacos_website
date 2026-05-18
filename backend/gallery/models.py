from django.db import models


class GalleryImage(models.Model):
    CATEGORY_CHOICES = [
        ('Hackathons', 'Hackathons'),
        ('Workshops', 'Workshops'),
        ('Socials', 'Socials'),
        ('Others', 'Others'),
    ]

    image_url = models.URLField(blank=True, max_length=2048)
    caption = models.CharField(max_length=255, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    category = models.CharField(
        max_length=50, choices=CATEGORY_CHOICES, default='Others'
    )
    display_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-created_at']

    def __str__(self):
        return self.caption or f'Gallery Image {self.id}'

    @property
    def resolved_url(self):
        return self.image_url or None