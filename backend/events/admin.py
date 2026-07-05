# backend/events/admin.py

from django.contrib import admin
from .models import Event, EventRegistration


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


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'checked_in_at', 'checked_in_by', 'created_at')
    list_filter = ('event', 'checked_in_at')
    search_fields = ('user__full_name', 'user__matric_number', 'event__title')
    readonly_fields = ('token', 'created_at')
