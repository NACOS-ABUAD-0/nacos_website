# backend/events/admin.py

from django.contrib import admin
from .models import Event, EventRegistration, TicketPayment, TicketType


class TicketTypeInline(admin.TabularInline):
    model = TicketType
    extra = 0
    fields = ('name', 'price', 'capacity', 'venue', 'sales_closed', 'sort_order')


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'start_time',
        'end_time',
        'location',
        'audience',
        'email_design',
        'is_published',
        'is_closed',
        'contact_email',
        'created_at',
    )
    list_filter = ('is_published', 'is_closed', 'audience')
    search_fields = ('title', 'location', 'description')
    ordering = ('start_time',)
    inlines = [TicketTypeInline]


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'user', 'event', 'ticket_type', 'status', 'checked_in_at', 'checked_in_by', 'created_at')
    list_filter = ('event', 'status', 'checked_in_at')
    search_fields = ('name', 'email', 'user__full_name', 'user__matric_number', 'event__title')
    readonly_fields = ('token', 'created_at')
    actions = ['reset_check_in']

    @admin.action(description='Reset check-in (let these tickets be scanned again)')
    def reset_check_in(self, request, queryset):
        count = queryset.filter(checked_in_at__isnull=False).update(checked_in_at=None, checked_in_by=None)
        self.message_user(request, f'Reset check-in for {count} ticket(s). They can now be scanned again.')


@admin.register(TicketPayment)
class TicketPaymentAdmin(admin.ModelAdmin):
    list_display = ('reference', 'event', 'email', 'ticket_type', 'amount_kobo', 'status', 'needs_attention', 'paid_at', 'created_at')
    list_filter = ('needs_attention', 'status', 'event')
    search_fields = ('reference', 'email', 'paystack_id')
    # Everything is read-only except the attention flag, which an admin clears once it's dealt with.
    readonly_fields = [field.name for field in TicketPayment._meta.fields if field.name != 'needs_attention']
