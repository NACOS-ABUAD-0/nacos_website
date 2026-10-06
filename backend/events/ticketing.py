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

from .emails import render_ticket_email
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


def _find_registration(event: Event, user, email: str, lock: bool = False) -> EventRegistration | None:
    """A member's own registration first, otherwise whatever ticket this email already has."""
    queryset = EventRegistration.objects.select_for_update() if lock else EventRegistration.objects.all()
    if user is not None:
        own = queryset.filter(event=event, user=user).first()
        if own:
            return own
    return queryset.filter(event=event, email=email).first()


def _already_confirmed(registration: EventRegistration, user) -> EventRegistration:
    """
    What to do when this email already has a confirmed ticket. The member who owns it just gets it back.
    A signed-in member whose email matches an earlier guest ticket takes it over. Anyone else gets the
    ticket re-sent to that email, never shown on screen, so typing someone's email can't take their ticket.
    """
    if user is not None and registration.user_id in (None, user.pk):
        if registration.user_id is None:
            registration.user = user
            registration.save(update_fields=['user'])
        return registration
    # Sent directly: on_commit would be dropped when the error below rolls the transaction back.
    send_ticket_email(registration)
    raise RegistrationError(
        "A ticket has already been issued to this email. We've sent it to that inbox again.",
        409, "ticket_already_issued",
    )


def register(event: Event, *, user, name: str, email: str, ticket_type: TicketType | None) -> tuple[EventRegistration, TicketPayment | None, bool]:
    """
    Gets `name`/`email` a ticket for `event`; `user` is the signed-in account or None for a guest.
    One ticket per email. Free tickets (or events without ticket types) are confirmed at once;
    paid tickets hold a seat and return a Paystack checkout.

    Returns (registration, payment needing checkout or None, created).
    Raises RegistrationError for sold-out / unavailable / already-issued cases and PaystackError if
    checkout can't start.
    """
    email = email.strip().lower()
    existing = _find_registration(event, user, email)
    if existing and existing.status == Status.PENDING_PAYMENT:
        settle_pending_payments(existing)
    if existing and existing.is_confirmed:
        return _already_confirmed(existing, user), None, False

    if existing and ticket_type and not ticket_type.is_free:
        payment = open_checkout(existing, ticket_type)
        if payment:
            return existing, payment, False

    with transaction.atomic():
        # Lock the event row so two buyers can't both take the last seat.
        Event.objects.select_for_update().get(pk=event.pk)
        registration = _find_registration(event, user, email, lock=True)
        if registration and registration.is_confirmed:
            return _already_confirmed(registration, user), None, False

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
            'name': name.strip(),
            'email': email,
            'ticket_type': ticket_type,
            'status': Status.PENDING_PAYMENT if paid else Status.CONFIRMED,
            'amount_kobo': ticket_type.price_kobo if paid else 0,
            'hold_expires_at': timezone.now() + timedelta(minutes=settings.TICKET_PAYMENT_HOLD_MINUTES) if paid else None,
        }
        if user is not None:
            fields['user'] = user
        created = registration is None
        if created:
            registration = EventRegistration.objects.create(event=event, **fields)
        else:
            for field, value in fields.items():
                setattr(registration, field, value)
            registration.save(update_fields=list(fields))

        if not paid:
            confirmed = registration
            transaction.on_commit(lambda: send_ticket_email(confirmed))
            return registration, None, created

        payment = TicketPayment.objects.create(
            registration=registration,
            event=event,
            email=email,
            ticket_type=ticket_type,
            reference=generate_reference(event.pk, registration.pk),
            amount_kobo=ticket_type.price_kobo,
        )

    try:
        checkout = initialize_payment(
            amount_kobo=payment.amount_kobo,
            email=email,
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
    """Sends the holder their ticket (code + link to the QR page), for free and paid tickets alike."""
    if not registration.email or not registration.is_confirmed:
        return
    try:
        subject, text, html = render_ticket_email(registration)
        send_mail(
            subject=subject,
            message=text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[registration.email],
            html_message=html,
            fail_silently=False,
        )
    except Exception as exc:  # The ticket is confirmed either way; email is a courtesy.
        logger.error("Ticket confirmed for registration %s but email failed: %s", registration.pk, exc)
