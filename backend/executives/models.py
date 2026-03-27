from django.db import models


class Executive(models.Model):
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255, help_text='Executive office or role title')
    job_description = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    website = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
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
