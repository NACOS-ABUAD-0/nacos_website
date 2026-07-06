# backend/complaints/admin.py

from django.contrib import admin
from .models import Complaint


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['subject', 'submitter_display', 'status', 'created_at']
    list_filter = ['status', 'is_anonymous']
    search_fields = ['subject', 'message']
    readonly_fields = ['is_anonymous', 'user', 'subject', 'message', 'created_at', 'updated_at']

    @admin.display(description='Submitted by')
    def submitter_display(self, obj):
        if obj.is_anonymous:
            return 'Anonymous'
        return obj.user.full_name if obj.user else '—'
