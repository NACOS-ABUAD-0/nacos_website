# backend/events/admin.py

from django.contrib import admin
from .models import Event, EventRegistration, TicketPayment, TicketType


class TicketTypeInline(admin.TabularInline):
    model = TicketType
    extra = 0
    fields = ('name', 'price', 'capacity', 'venue', 'sort_order')


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
    inlines = [TicketTypeInline]


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'ticket_type', 'status', 'checked_in_at', 'checked_in_by', 'created_at')
    list_filter = ('event', 'status', 'checked_in_at')
    search_fields = ('user__full_name', 'user__matric_number', 'event__title')
    readonly_fields = ('token', 'created_at')



@admin.register(TicketPayment)
class TicketPaymentAdmin(admin.ModelAdmin):
    list_display = ('reference', 'event', 'email', 'ticket_type', 'amount_kobo', 'status', 'paid_at', 'created_at')
    list_filter = ('status', 'event')
    search_fields = ('reference', 'email', 'paystack_id')
    readonly_fields = [field.name for field in TicketPayment._meta.fields]
