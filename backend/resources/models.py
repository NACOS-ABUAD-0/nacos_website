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
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    # Core fields
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    url = models.URLField()  # Google Drive view link, or a Cloudinary URL for uploads
    download_url = models.URLField(blank=True, null=True)  # Direct download link

    # Categorization
    course_code = models.CharField(max_length=20, blank=True, null=True)
    year = models.CharField(max_length=10, blank=True, null=True)
    category = models.ForeignKey(ResourceCategory, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField('ResourceTag', blank=True)

    # File metadata
    file_type = models.CharField(max_length=100)
    file_size = models.BigIntegerField(null=True, blank=True)  # Size in bytes
    # Historically a real Google Drive file ID; for direct uploads this is a
    # synthetic "upload-<uuid>" value instead (see ResourceSubmitView) — kept
    # as-is rather than renaming/restructuring the field for this feature.
    drive_file_id = models.CharField(max_length=100, unique=True)

    # Additional metadata
    drive_metadata = models.JSONField(default=dict, blank=True)  # Store full Drive metadata
    is_public = models.BooleanField(default=True)
    download_count = models.PositiveIntegerField(default=0)

    # Student submissions (as opposed to Drive-synced/admin-added resources)
    # start at PENDING and stay out of the public list until an admin
    # approves them. Default APPROVED so every existing/Drive-synced/
    # admin-created resource behaves exactly as before.
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPROVED, db_index=True)
    submitted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_resources',
    )
    admin_note = models.TextField(blank=True)

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

        size = float(self.file_size)
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

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