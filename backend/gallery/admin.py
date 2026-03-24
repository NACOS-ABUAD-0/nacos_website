from django.contrib import admin
from .models import GalleryImage


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'caption', 'display_order', 'is_published', 'created_at')
    list_filter = ('is_published',)
    search_fields = ('caption', 'alt_text')
    ordering = ('display_order', '-created_at')
