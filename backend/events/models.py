# backend/events/models.py
import secrets
import uuid

from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone


# No 0/O, 1/I/L: the code gets read off a phone and typed at a noisy gate.
SHORT_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def generate_short_code() -> str:
    chars = ''.join(secrets.choice(SHORT_CODE_ALPHABET) for _ in range(8))
    return f"{chars[:4]}-{chars[4:]}"


def normalize_short_code(value: str) -> str | None:
    """'k7qf 3m2p' / 'K7QF3M2P' -> 'K7QF-3M2P'; None if it can't be a ticket code."""
    compact = ''.join(ch for ch in str(value).upper() if ch.isalnum())
    if len(compact) != 8 or any(ch not in SHORT_CODE_ALPHABET for ch in compact):
        return None
    return f"{compact[:4]}-{compact[4:]}"


class Event(models.Model):
    class Audience(models.TextChoices):
        # Buyers must be signed in; their account name and email go on the ticket.
        NACOS_ONLY = 'nacos_only', 'NACOS members only'
        # Anyone can get a ticket with just a name and email; one ticket per email.
        PUBLIC = 'public', 'Open to everyone'

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
    # Events created before this setting existed required sign-in, so that stays the default.
    audience = models.CharField(max_length=20, choices=Audience.choices, default=Audience.NACOS_ONLY)
    # Look of the ticket email: a key of events.emails.EMAIL_DESIGNS. Not a DB-level choice, so adding a
    # design for a new event needs no migration.
    email_design = models.CharField(max_length=40, default='standard')
    # Used when email_design is "custom": {mode: light|dark, accent, highlight, greeting, note}.
    email_custom = models.JSONField(default=dict, blank=True)
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
    # Null for guests on open events, who register with just a name and email.
    user = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, null=True, blank=True, related_name='event_registrations',
    )
    # Who the ticket is for. Copied from the account for signed-in users; lowercased email.
    name = models.CharField(max_length=255, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    # Secret value in the QR code; also unlocks the ticket page for guests, so treat it like a password.
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    # Typed at the gate when the QR code won't scan; printed on the ticket and in the ticket email.
    short_code = models.CharField(max_length=9, unique=True, default=generate_short_code, editable=False)
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
        # One ticket per email per event (guests and members alike).
        constraints = [
            models.UniqueConstraint(fields=['event', 'email'], name='unique_registration_email_per_event'),
        ]

    @property
    def is_checked_in(self) -> bool:
        return self.checked_in_at is not None

    @property
    def is_confirmed(self) -> bool:
        return self.status == self.Status.CONFIRMED

    def __str__(self):
        return f"{self.name or self.email} → {self.event.title}"


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
