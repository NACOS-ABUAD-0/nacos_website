from django.contrib import admin

from .models import DeviceToken, ExecutiveRole


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'platform', 'created_at']
    list_filter = ['platform']
    search_fields = ['user__email', 'token']


@admin.register(ExecutiveRole)
class ExecutiveRoleAdmin(admin.ModelAdmin):
    list_display = ['label', 'value', 'display_order']
    ordering = ['display_order', 'label']
