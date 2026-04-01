# backend/events/admin.py

from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'start_time',
        'end_time',
        'location',
        'is_published',
        'contact_email',
        'created_at',
    )
    list_filter = ('is_published',)
    search_fields = ('title', 'location', 'description')
    ordering = ('start_time',)
