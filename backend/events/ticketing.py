# backend/events/ticketing.py
"""Seat counting, the paid-registration flow and Paystack settlement."""
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.html import escape

from .models import Event, EventRegistration, TicketPayment, TicketType
from .paystack import PaystackError, initialize_payment, verify_payment

logger = logging.getLogger(__name__)

Status = EventRegistration.Status
PaymentStatus = TicketPayment.Status


def active_registration_q() -> Q:
    """Registrations that take a seat: confirmed ones plus unpaid ones still inside their hold."""
    return Q(status=Status.CONFIRMED) | Q(status=Status.PENDING_PAYMENT, hold_expires_at__gt=timezone.now())


def seat_counts(event_id: int) -> tuple[int, dict[int, int]]:
    """(seats taken for the event, {ticket_type_id: seats taken})."""
    rows = (
        EventRegistration.objects.filter(event_id=event_id).filter(active_registration_q())
        .values('ticket_type_id').annotate(n=Count('id'))
    )
    by_type = {row['ticket_type_id']: row['n'] for row in rows if row['ticket_type_id'] is not None}
    return sum(row['n'] for row in rows), by_type


def generate_reference(event_id: int, registration_id: int) -> str:
    return f"NACOS-{event_id}-{registration_id}-{secrets.token_hex(5).upper()}"


class RegistrationError(Exception):
    def __init__(self, detail: str, status: int, code: str):
        super().__init__(detail)
        self.detail, self.status, self.code = detail, status, code


def open_checkout(registration: EventRegistration, ticket_type: TicketType | None = None) -> TicketPayment | None:
    """The Paystack checkout a pending registration can still continue, if any."""
    if registration.status != Status.PENDING_PAYMENT:
        return None
    if not registration.hold_expires_at or registration.hold_expires_at <= timezone.now():
        return None
    payments = registration.payments.filter(status=PaymentStatus.PENDING).exclude(checkout_url='')
    if ticket_type is not None:
        payments = payments.filter(ticket_type=ticket_type)
    return payments.first()


def settle_pending_payments(registration: EventRegistration) -> None:
    """Ask Paystack about earlier checkouts, so a payment that went through late is honoured
    instead of charging the buyer twice."""
    for payment in registration.payments.filter(status=PaymentStatus.PENDING):
        try:
            settle_payment(payment.reference)
        except PaystackError as exc:
            logger.error("Could not re-check payment %s: %s", payment.reference, exc)
    registration.refresh_from_db()


def register(event: Event, user, ticket_type: TicketType | None) -> tuple[EventRegistration, TicketPayment | None, bool]:
    """
    Registers `user` for `event`. Free tickets (or events without ticket types) are confirmed at once;
    paid tickets hold a seat and return a Paystack checkout.

    Returns (registration, payment needing checkout or None, created).
    Raises RegistrationError for sold-out / unavailable cases and PaystackError if checkout can't start.
    """
    existing = EventRegistration.objects.filter(event=event, user=user).first()
    if existing and existing.status == Status.PENDING_PAYMENT:
        settle_pending_payments(existing)
    if existing and existing.is_confirmed:
        return existing, None, False

    if existing and ticket_type and not ticket_type.is_free:
        payment = open_checkout(existing, ticket_type)
        if payment:
            return existing, payment, False

    with transaction.atomic():
        # Lock the event row so two buyers can't both take the last seat.
        Event.objects.select_for_update().get(pk=event.pk)
        registration = EventRegistration.objects.select_for_update().filter(event=event, user=user).first()
        if registration and registration.is_confirmed:
            return registration, None, False

        if ticket_type is not None:
            # Re-read inside the lock in case the type was edited or removed a moment ago.
            ticket_type = TicketType.objects.filter(pk=ticket_type.pk, event=event).first()
            if ticket_type is None:
                raise RegistrationError("That ticket type is no longer available. Please choose again.", 409, "ticket_type_required")

        others = EventRegistration.objects.filter(event=event).filter(active_registration_q())
        if registration:
            others = others.exclude(pk=registration.pk)
        if event.capacity is not None and others.count() >= event.capacity:
            raise RegistrationError("Sorry, this event is sold out.", 409, "sold_out")
        if ticket_type is not None and ticket_type.capacity is not None \
                and others.filter(ticket_type=ticket_type).count() >= ticket_type.capacity:
            raise RegistrationError(f"Sorry, {ticket_type.name} tickets are sold out.", 409, "sold_out")

        paid = ticket_type is not None and not ticket_type.is_free
        fields = {
            'ticket_type': ticket_type,
            'status': Status.PENDING_PAYMENT if paid else Status.CONFIRMED,
            'amount_kobo': ticket_type.price_kobo if paid else 0,
            'hold_expires_at': timezone.now() + timedelta(minutes=settings.TICKET_PAYMENT_HOLD_MINUTES) if paid else None,
        }
        created = registration is None
        if created:
            registration = EventRegistration.objects.create(event=event, user=user, **fields)
        else:
            for name, value in fields.items():
                setattr(registration, name, value)
            registration.save(update_fields=list(fields))

        if not paid:
            return registration, None, created

        payment = TicketPayment.objects.create(
            registration=registration,
            event=event,
            email=user.email,
            ticket_type=ticket_type,
            reference=generate_reference(event.pk, registration.pk),
            amount_kobo=ticket_type.price_kobo,
        )

    try:
        checkout = initialize_payment(
            amount_kobo=payment.amount_kobo,
            email=user.email,
            reference=payment.reference,
            # Paystack appends ?trxref=...&reference=..., which the event page uses to confirm the payment.
            callback_url=f"{settings.FRONTEND_URL.rstrip('/')}/events/{event.pk}",
            metadata={'event_id': event.pk, 'registration_id': registration.pk, 'ticket_type': ticket_type.name},
        )
    except PaystackError as exc:
        logger.error("Paystack initialize failed for %s: %s %s", payment.reference, exc, exc.body)
        payment.status = PaymentStatus.FAILED
        payment.gateway_payload = exc.body or {'message': str(exc)}
        payment.save(update_fields=['status', 'gateway_payload', 'updated_at'])
        registration.hold_expires_at = timezone.now()
        registration.save(update_fields=['hold_expires_at'])
        raise

    payment.checkout_url = checkout['authorization_url']
    payment.save(update_fields=['checkout_url', 'updated_at'])
    return registration, payment, created


# Paystack statuses not listed here (ongoing, pending, processing, queued, ...) stay pending.
PAYSTACK_STATUS_MAP = {
    'success': PaymentStatus.SUCCESSFUL,
    'failed': PaymentStatus.FAILED,
    'abandoned': PaymentStatus.ABANDONED,
    'reversed': PaymentStatus.FAILED,
}


def settle_payment(reference: str) -> TicketPayment | None:
    """
    Confirms a payment with Paystack and confirms the registration if it succeeded. Safe to call any
    number of times for the same reference (redirect page, webhook, retries). Never trusts the caller
    about the outcome; always asks Paystack. Returns None for an unknown reference.
    """
    payment = TicketPayment.objects.filter(reference=reference).first()
    if payment is None:
        return None
    if payment.status == PaymentStatus.SUCCESSFUL:
        return payment

    verified = verify_payment(reference)
    gateway_status = PAYSTACK_STATUS_MAP.get(str(verified.get('status', '')).lower(), PaymentStatus.PENDING)

    if gateway_status != PaymentStatus.SUCCESSFUL:
        if gateway_status != payment.status:
            payment.status = gateway_status
            payment.gateway_payload = verified
            payment.save(update_fields=['status', 'gateway_payload', 'updated_at'])
        return payment

    paid_amount = int(verified.get('amount') or 0)
    if paid_amount < payment.amount_kobo or str(verified.get('currency', '')).upper() != 'NGN':
        logger.error("Payment %s amount mismatch: expected %s kobo NGN, got %s", reference, payment.amount_kobo, verified)
        payment.status = PaymentStatus.FAILED
        payment.gateway_payload = verified
        payment.save(update_fields=['status', 'gateway_payload', 'updated_at'])
        return payment

    newly_confirmed = None
    with transaction.atomic():
        payment = TicketPayment.objects.select_for_update().get(pk=payment.pk)
        if payment.status != PaymentStatus.SUCCESSFUL:
            fees = verified.get('fees')
            payment.status = PaymentStatus.SUCCESSFUL
            payment.paid_at = timezone.now()
            payment.paystack_id = str(verified.get('id') or '')
            payment.fees_kobo = int(fees) if isinstance(fees, (int, float)) else None
            payment.gateway_payload = verified
            payment.save()

        registration = (
            EventRegistration.objects.select_for_update().filter(pk=payment.registration_id).first()
            if payment.registration_id else None
        )
        if registration is None:
            logger.warning("Payment %s succeeded but its registration no longer exists; refund required", reference)
        elif registration.status == Status.PENDING_PAYMENT:
            # Issue even if the hold expired: they paid, so they get the ticket. The checkout that was
            # actually paid decides the ticket type and price.
            registration.status = Status.CONFIRMED
            registration.amount_kobo = payment.amount_kobo
            registration.hold_expires_at = None
            if payment.ticket_type_id:
                registration.ticket_type_id = payment.ticket_type_id
            registration.save(update_fields=['status', 'amount_kobo', 'hold_expires_at', 'ticket_type'])
            newly_confirmed = registration
        else:
            logger.warning("Payment %s succeeded but registration %s was already confirmed; refund required", reference, registration.pk)

    if newly_confirmed is not None:
        transaction.on_commit(lambda: send_ticket_email(newly_confirmed))
    return payment


def send_ticket_email(registration: EventRegistration) -> None:
    """Confirmation for a paid ticket. The QR code itself lives on the event page."""
    event = registration.event
    type_name = registration.ticket_type.name if registration.ticket_type else 'Event'
    event_url = f"{settings.FRONTEND_URL.rstrip('/')}/events/{event.pk}"
    when = timezone.localtime(event.start_time).strftime('%A %d %B %Y, %I:%M %p')
    where = registration.ticket_type.effective_venue if registration.ticket_type else (
        'Online' if event.is_remote else event.location
    )
    amount = f"₦{registration.amount_kobo / 100:,.2f}"

    message = (
        f"Hi {registration.user.full_name},\n\n"
        f"Your {type_name} ticket for {event.title} is confirmed ({amount} paid).\n\n"
        f"When: {when}\nWhere: {where}\n\n"
        f"Open {event_url} while signed in to show your QR code at the entrance.\n\nNACOS ABUAD"
    )
    html_message = f"""
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
  <h2 style="color: #006E3A; margin: 0 0 8px;">Your ticket is confirmed</h2>
  <p style="margin: 0 0 16px;">Hi {escape(registration.user.full_name)}, your <strong>{escape(type_name)}</strong> ticket for
  <strong>{escape(event.title)}</strong> is confirmed ({amount} paid).</p>
  <p style="margin: 4px 0;"><strong>When:</strong> {when}</p>
  <p style="margin: 4px 0 20px;"><strong>Where:</strong> {escape(where)}</p>
  <a href="{escape(event_url)}" style="display: inline-block; background: #006E3A; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px;">Show my QR code</a>
  <p style="font-size: 12px; color: #777; margin-top: 20px;">Sign in on the event page to show your QR code at the entrance.</p>
</div>"""
    try:
        send_mail(
            subject=f"Your {type_name} ticket: {event.title}",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[registration.user.email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as exc:  # The ticket is confirmed either way; email is a courtesy.
        logger.error("Ticket confirmed for registration %s but email failed: %s", registration.pk, exc)
