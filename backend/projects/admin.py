# backend/projects/admin.py
from django.contrib import admin
from .models import Project, SkillTag

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'created_at', 'is_featured', 'status']
    list_filter = ['is_featured', 'status', 'created_at', 'tags']
    search_fields = ['title', 'description', 'owner__email']
    filter_horizontal = ['tags']


@admin.register(SkillTag)
class SkillTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

