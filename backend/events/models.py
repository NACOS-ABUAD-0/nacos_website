# backend/events/models.py
import uuid

from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone


class Event(models.Model):
    title = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=500, blank=True, default="")  # blank=True + default for remote events
    is_remote = models.BooleanField(default=False)
    # Filled with the Cloudinary URL of the poster uploaded from the admin page.
    poster_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    # Legacy external sign-up link. Registration now happens in-app; kept so old events still read.
    registration_url = models.URLField(blank=True)
    contact_email = models.EmailField(blank=True)
    # Maximum registrations across all ticket types; null means unlimited.
    capacity = models.PositiveIntegerField(null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return self.title

    @property
    def status(self):
        now = timezone.now()
        if now < self.start_time:
            return 'upcoming'
        if self.end_time and now <= self.end_time:
            return 'ongoing'
        return 'completed'


class TicketType(models.Model):
    """A kind of ticket for an event, e.g. "Regular" or "VIP", each with its own price and seat limit.
    Events with no ticket types keep the original free, unlimited registration."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ticket_types')
    name = models.CharField(max_length=60)
    # Naira; 0 means this ticket type is free.
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # Maximum tickets of this type; null means limited only by the event's capacity.
    capacity = models.PositiveIntegerField(null=True, blank=True)
    # Where holders of this ticket go, when it differs from the event's location (e.g. a VIP lounge).
    venue = models.CharField(max_length=500, blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']
        constraints = [
            models.UniqueConstraint(Lower('name'), 'event', name='unique_ticket_type_name_per_event'),
        ]

    @property
    def is_free(self) -> bool:
        return self.price <= 0

    @property
    def price_kobo(self) -> int:
        return int(round(self.price * 100))

    @property
    def effective_venue(self) -> str:
        if self.venue:
            return self.venue
        return 'Online' if self.event.is_remote else self.event.location

    def __str__(self):
        return f"{self.event.title} — {self.name}"


class EventRegistration(models.Model):
    class Status(models.TextChoices):
        # Waiting for Paystack; holds a seat until hold_expires_at, and can't be checked in.
        PENDING_PAYMENT = 'pending_payment', 'Pending payment'
        CONFIRMED = 'confirmed', 'Confirmed'

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='event_registrations')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    ticket_type = models.ForeignKey(
        TicketType, on_delete=models.SET_NULL, null=True, blank=True, related_name='registrations',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CONFIRMED)
    # What was paid in kobo; 0 for free registrations.
    amount_kobo = models.PositiveIntegerField(default=0)
    hold_expires_at = models.DateTimeField(null=True, blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='event_checkins_performed',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['event', 'user']
        ordering = ['-created_at']
        indexes = [models.Index(fields=['event', 'checked_in_at'])]

    @property
    def is_checked_in(self) -> bool:
        return self.checked_in_at is not None

    @property
    def is_confirmed(self) -> bool:
        return self.status == self.Status.CONFIRMED

    def __str__(self):
        return f"{self.user.full_name} → {self.event.title}"


class TicketPayment(models.Model):
    """One row per Paystack checkout. A registration can have several if the buyer abandons and retries."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCESSFUL = 'successful', 'Successful'
        FAILED = 'failed', 'Failed'
        ABANDONED = 'abandoned', 'Abandoned'

    # Payment records outlive their registration (e.g. a deleted account), so the event and payer
    # email are kept on the payment itself. Deleting an event with payments is blocked (PROTECT).
    registration = models.ForeignKey(
        EventRegistration, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments',
    )
    event = models.ForeignKey(Event, on_delete=models.PROTECT, related_name='payments')
    email = models.EmailField()
    # The ticket type this checkout was for; the registration takes it if the payment succeeds.
    ticket_type = models.ForeignKey(TicketType, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    reference = models.CharField(max_length=64, unique=True)
    amount_kobo = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    checkout_url = models.URLField(max_length=1024, blank=True)
    paystack_id = models.CharField(max_length=64, blank=True)
    # Paystack's fee in kobo, from the verify response.
    fees_kobo = models.PositiveIntegerField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    # Last verify response from Paystack, kept for reconciliation and disputes.
    gateway_payload = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference} ({self.status})"
