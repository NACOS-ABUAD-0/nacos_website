from django.contrib import admin
from .models import Executive


@admin.register(Executive)
class ExecutiveAdmin(admin.ModelAdmin):
    list_display = ('name', 'title', 'session', 'email', 'phone', 'display_order', 'is_active', 'created_at')
    list_filter = ('session', 'is_active')
    search_fields = ('name', 'title', 'email', 'job_description')
    ordering = ('-session', 'display_order', 'name')
