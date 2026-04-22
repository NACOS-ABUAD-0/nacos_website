# backend/committees/admin.py

from django.contrib import admin
from .models import Committee, CommitteeApplication


@admin.register(Committee)
class CommitteeAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(CommitteeApplication)
class CommitteeApplicationAdmin(admin.ModelAdmin):
    list_display = ['user', 'committee', 'status', 'created_at']
    list_filter = ['status', 'committee']
    search_fields = ['user__full_name', 'user__matric_number', 'committee__name']
    readonly_fields = ['created_at', 'updated_at']