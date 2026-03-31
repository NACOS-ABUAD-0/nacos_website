from django.contrib import admin
from .models import Event, EventAttendance


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'start_time',
        'end_time',
        'location',
        'is_published',
        'contact_email',
        'created_at',
    )
    list_filter = ('is_published',)
    search_fields = ('name', 'location', 'description')
    ordering = ('start_time',)


@admin.register(EventAttendance)
class EventAttendanceAdmin(admin.ModelAdmin):
    list_display = (
        'event',
        'student',
        'is_checked_in',
        'checked_in_at',
        'checked_in_by',
        'created_at',
    )
    list_filter = ('is_checked_in', 'event')
    search_fields = ('student__email', 'student__full_name', 'event__name')
