from django.contrib import admin

from .models import ClassAttendance, ClassSession


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ('course_code', 'opened_at', 'closed_at', 'created_by')
    list_filter = ('course_code', 'closed_at')
    search_fields = ('course_code',)
    readonly_fields = ('token', 'opened_at')


@admin.register(ClassAttendance)
class ClassAttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'session', 'scanned_at')
    list_filter = ('session__course_code',)
    search_fields = ('student__full_name', 'student__matric_number', 'session__course_code')
