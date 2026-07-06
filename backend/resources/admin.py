# backend/resources/admin.py

from django.contrib import admin
from .models import Resource, ResourceCategory, ResourceTag, ResourceDownload


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'submitted_by', 'course_code', 'is_public', 'created_at']
    list_filter = ['status', 'is_public', 'category']
    search_fields = ['title', 'description', 'course_code']


@admin.register(ResourceCategory)
class ResourceCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(ResourceTag)
class ResourceTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(ResourceDownload)
class ResourceDownloadAdmin(admin.ModelAdmin):
    list_display = ['resource', 'user', 'downloaded_at']
    readonly_fields = ['resource', 'user', 'downloaded_at', 'ip_address']
