# backend/resources/models.py
from django.db import models
from accounts.models import User


class ResourceCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Resource categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Resource(models.Model):
    # Core fields
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    url = models.URLField()  # Google Drive view link
    download_url = models.URLField(blank=True, null=True)  # Direct download link

    # Categorization
    course_code = models.CharField(max_length=20, blank=True, null=True)
    year = models.CharField(max_length=10, blank=True, null=True)
    category = models.ForeignKey(ResourceCategory, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField('ResourceTag', blank=True)

    # File metadata
    file_type = models.CharField(max_length=100)
    file_size = models.BigIntegerField(null=True, blank=True)  # Size in bytes
    drive_file_id = models.CharField(max_length=100, unique=True)  # Google Drive file ID

    # Additional metadata
    drive_metadata = models.JSONField(default=dict, blank=True)  # Store full Drive metadata
    is_public = models.BooleanField(default=True)
    download_count = models.PositiveIntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def get_file_size_display(self):
        """Convert bytes to human readable format"""
        if not self.file_size:
            return "Unknown"

        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.file_size < 1024.0:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024.0
        return f"{self.file_size:.1f} TB"

    def get_file_icon(self):
        """Get appropriate icon based on file type"""
        file_type = self.file_type.lower()

        icon_map = {
            'pdf': '📄',
            'document': '📝',
            'spreadsheet': '📊',
            'presentation': '📽️',
            'image': '🖼️',
            'video': '🎬',
            'audio': '🎵',
            'archive': '📦',
            'code': '💻',
            'default': '📎'
        }

        if 'pdf' in file_type:
            return icon_map['pdf']
        elif any(doc_type in file_type for doc_type in ['document', 'word']):
            return icon_map['document']
        elif any(sheet_type in file_type for sheet_type in ['spreadsheet', 'excel']):
            return icon_map['spreadsheet']
        elif any(pres_type in file_type for pres_type in ['presentation', 'powerpoint']):
            return icon_map['presentation']
        elif 'image' in file_type:
            return icon_map['image']
        elif 'video' in file_type:
            return icon_map['video']
        elif 'audio' in file_type:
            return icon_map['audio']
        elif any(archive_type in file_type for archive_type in ['zip', 'rar', 'tar', '7z']):
            return icon_map['archive']
        elif any(code_type in file_type for code_type in ['python', 'javascript', 'java', 'cpp', 'html', 'css']):
            return icon_map['code']
        else:
            return icon_map['default']


class ResourceTag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class ResourceDownload(models.Model):
    """Track resource downloads"""
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='downloads')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    downloaded_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-downloaded_at']