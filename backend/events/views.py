import json
import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.utils import timezone
from rest_framework import filters, mixins, permissions, viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle
from rest_framework.views import APIView

from accounts.permissions import IsAdminOrExecutive

from .filters import EventFilter
from .models import Event, EventRegistration, TicketPayment, normalize_short_code
from .paystack import PaystackError, is_valid_webhook_signature
from .serializers import (
    AdminEventRegistrationSerializer,
    EventRegistrationSerializer,
    EventSerializer,
    TicketTypeBriefSerializer,
)
from .emails import email_design_choices, render_preview
from .ticketing import (
    RegistrationError, handle_dispute, handle_refund, open_checkout, register, settle_payment, settle_pending_payments,
)

logger = logging.getLogger(__name__)


def can_manage_events(user) -> bool:
    """Admin-tier staff (Admin, Super Admin, Lecturer) and every exco can upload, edit and delete events."""
    return bool(user and user.is_authenticated and (user.is_admin or user.is_executive))


class IsEventManager(permissions.BasePermission):
    message = "Only admins and excos can manage events."

    def has_permission(self, request, view) -> bool:
        return can_manage_events(request.user)


class IsEventManagerOrReadOnly(permissions.BasePermission):
    message = "Only admins and excos can manage events."

    def has_permission(self, request, view) -> bool:
        return request.method in permissions.SAFE_METHODS or can_manage_events(request.user)


class GuestTicketThrottle(AnonRateThrottle):
    """Caps tickets requested without signing in, per IP: each one can send an email."""
    scope = 'event_ticket_guest'


def registration_response(registration, payment=None, status=200):
    """The holder's registration, plus the Paystack checkout to continue when payment is pending."""
    data = EventRegistrationSerializer(registration).data
    payment = payment or open_checkout(registration)
    data["checkout_url"] = payment.checkout_url if payment else None
    data["reference"] = payment.reference if payment else None
    return Response(data, status=status)


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer

    # Use the explicit FilterSet so DjangoFilterBackend never sees (and
    # rejects) the `status` or `upcoming` query params that we handle
    # manually below.
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EventFilter

    search_fields = ["title", "location", "description"]
    ordering_fields = ["start_time", "end_time", "created_at", "title"]
    ordering = ["start_time"]

    def get_permissions(self):
        # Registration is student-facing and only needs authentication;
        # everything else (including plain reads) follows the public
        # read / staff write rule below.
        if self.action == "register":
            # Open events take guests; NACOS-only events check sign-in in register() itself.
            return [permissions.AllowAny()]
        if self.action == "my_registration":
            return [permissions.IsAuthenticated()]
        if self.action in ("email_designs", "email_preview"):
            return [permissions.IsAuthenticated(), IsEventManager()]
        return [IsEventManagerOrReadOnly()]

    def get_queryset(self):
        # Event managers see drafts too; public sees published only.
        qs = (
            Event.objects.all()
            if can_manage_events(self.request.user)
            else Event.objects.filter(is_published=True)
        )

        now = timezone.now()

        # ?upcoming=true  → start_time in the future
        if self.request.query_params.get("upcoming") in ("true", "1", "True"):
            qs = qs.filter(start_time__gte=now)

        # ?status=upcoming|ongoing|completed
        status = self.request.query_params.get("status")
        if status == "upcoming":
            qs = qs.filter(start_time__gt=now)
        elif status == "ongoing":
            qs = qs.filter(start_time__lte=now, end_time__gte=now)
        elif status == "completed":
            qs = qs.filter(end_time__lt=now)

        return qs.prefetch_related("ticket_types")

    @action(detail=False, methods=["get"], url_path="email-designs")
    def email_designs(self, request):
        """Ticket email designs for the admin event form's dropdown."""
        return Response(email_design_choices())

    @action(detail=False, methods=["post"], url_path="email-preview")
    def email_preview(self, request):
        """The ticket email for the admin form's current values, filled with a sample buyer."""
        try:
            return Response({"html": render_preview(request.data)})
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)

    def destroy(self, request, *args, **kwargs):
        event = self.get_object()
        paid = TicketPayment.objects.filter(event=event, status=TicketPayment.Status.SUCCESSFUL).count()
        if paid:
            return Response(
                {"detail": f"{paid} people have paid for tickets to this event, so it can't be deleted. "
                           f"Unpublish it to hide it, or refund every payment in Paystack and then delete it."},
                status=409,
            )
        with transaction.atomic():
            # Unpaid checkout records only; they would otherwise block the delete.
            TicketPayment.objects.filter(event=event).delete()
            event.delete()
        return Response(status=204)

    @action(detail=True, methods=["post"], url_path="register", throttle_classes=[GuestTicketThrottle])
    def register(self, request, pk=None):
        """
        Body: { "ticket_type": <id>, "name": ..., "email": ... }
        - ticket_type is required when the event has more than one ticket type.
        - NACOS-only events need a signed-in account (name/email come from it).
        - Open events take name + email from guests; signed-in users use their account. One ticket per email.
        Free tickets (and events without ticket types) are confirmed straight away. Paid tickets return
        a Paystack checkout_url; the registration stays pending_payment (no QR) until Paystack confirms.
        """
        event = self.get_object()
        if event.status == "completed":
            return Response({"detail": "Registration is closed for this event."}, status=400)

        user = request.user if request.user.is_authenticated else None
        if user is not None:
            name, email = user.full_name, user.email
        elif event.audience == Event.Audience.NACOS_ONLY:
            return Response(
                {"detail": "This event is for NACOS members only. Please sign in to get a ticket.", "code": "sign_in_required"},
                status=401,
            )
        else:
            name = str(request.data.get("name") or "").strip()
            email = str(request.data.get("email") or "").strip()
            errors = {}
            if not 2 <= len(name) <= 120:
                errors["name"] = ["Enter your full name."]
            try:
                validate_email(email)
            except DjangoValidationError:
                errors["email"] = ["Enter a valid email address."]
            if errors:
                return Response(errors, status=400)

        types = list(event.ticket_types.all())
        requested = request.data.get("ticket_type")
        ticket_type = None
        if types:
            if requested in (None, ""):
                ticket_type = types[0] if len(types) == 1 else None
            else:
                ticket_type = next((t for t in types if str(t.pk) == str(requested)), None)
            if ticket_type is None:
                return Response(
                    {
                        "detail": "Choose a ticket type." if requested in (None, "")
                        else "That ticket type isn't available for this event.",
                        "code": "ticket_type_required",
                        "ticket_types": TicketTypeBriefSerializer(types, many=True).data,
                    },
                    status=400,
                )

        try:
            registration, payment, created = register(event, user=user, name=name, email=email, ticket_type=ticket_type)
        except RegistrationError as exc:
            return Response({"detail": exc.detail, "code": exc.code}, status=exc.status)
        except PaystackError:
            return Response({"detail": "We couldn't start the payment. Please try again in a moment."}, status=502)

        return registration_response(registration, payment, status=201 if created else 200)

    @action(detail=True, methods=["get"], url_path="my-registration")
    def my_registration(self, request, pk=None):
        event = self.get_object()
        registration = EventRegistration.objects.filter(event=event, user=request.user).first()
        if registration is None and request.user.is_email_verified:
            # A ticket taken as a guest with the same email before signing in. Only for verified
            # emails: otherwise anyone could sign up with a guest's address and see their QR code.
            registration = EventRegistration.objects.filter(
                event=event, email=request.user.email.strip().lower(),
            ).first()
        if registration is None:
            return Response({"detail": "Not registered for this event."}, status=404)
        if registration.status == EventRegistration.Status.PENDING_PAYMENT:
            # Catches payments whose webhook is late or never arrived.
            settle_pending_payments(registration)
        return registration_response(registration)


class AdminEventRegistrationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Roster + check-in for event attendance. Admins and every exco can scan tickets."""

    queryset = (
        EventRegistration.objects.filter(status=EventRegistration.Status.CONFIRMED)
        .select_related("event", "user", "checked_in_by", "ticket_type")
        .order_by("-created_at")
    )
    serializer_class = AdminEventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrExecutive]
    # Always scoped to a single event via ?event=<id>; the check-in screen
    # needs the full roster for client-side search, and the site-wide
    # PageNumberPagination default (PAGE_SIZE=10) would silently truncate it.
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["event"]
    search_fields = ["name", "email", "short_code", "user__full_name", "user__matric_number"]

    def _perform_check_in(self, registration_pk):
        with transaction.atomic():
            registration = EventRegistration.objects.select_for_update().get(pk=registration_pk)
            if registration.status == EventRegistration.Status.CANCELLED:
                return Response(
                    {
                        "status": "cancelled",
                        "detail": "This ticket was cancelled (refunded), so it can't be used.",
                        "registration": AdminEventRegistrationSerializer(registration).data,
                    },
                    status=400,
                )
            if not registration.is_confirmed:
                return Response(
                    {
                        "status": "not_paid",
                        "detail": "This ticket hasn't been paid for.",
                        "registration": AdminEventRegistrationSerializer(registration).data,
                    },
                    status=400,
                )
            if registration.checked_in_at:
                return Response(
                    {
                        "status": "already_checked_in",
                        "registration": AdminEventRegistrationSerializer(registration).data,
                    },
                    status=200,
                )
            registration.checked_in_at = timezone.now()
            registration.checked_in_by = self.request.user
            registration.save(update_fields=["checked_in_at", "checked_in_by"])
        return Response(
            {
                "status": "checked_in",
                "registration": AdminEventRegistrationSerializer(registration).data,
            },
            status=200,
        )

    @action(detail=True, methods=["post"], url_path="check-in")
    def check_in(self, request, pk=None):
        # Not self.get_object(): the roster queryset hides unpaid registrations, and those should
        # get a clear "not paid" answer rather than a 404.
        if not EventRegistration.objects.filter(pk=pk).exists():
            return Response({"detail": "Not found."}, status=404)
        return self._perform_check_in(pk)

    @action(detail=False, methods=["post"], url_path="check-in-by-token")
    def check_in_by_token(self, request):
        """Body: { event, token } where token is the scanned QR value or the typed ticket code (e.g. K7QF-3M2P)."""
        token = str(request.data.get("token") or request.data.get("code") or "").strip()
        event_id = request.data.get("event")
        if not token or not event_id:
            return Response({"detail": "token and event are required."}, status=400)
        short_code = normalize_short_code(token)
        lookup = {"short_code": short_code} if short_code else {"token": token}
        try:
            registration = EventRegistration.objects.select_related("event").get(**lookup)
        except (EventRegistration.DoesNotExist, ValueError, DjangoValidationError):
            return Response(
                {
                    "status": "invalid",
                    "detail": "No ticket has that code." if short_code else "This QR code isn't a valid NACOS ticket.",
                },
                status=404,
            )
        if str(registration.event_id) != str(event_id):
            return Response(
                {"status": "wrong_event", "detail": f"This ticket is for {registration.event.title}, not this event."},
                status=404,
            )
        return self._perform_check_in(registration.pk)


class PaystackVerifyView(APIView):
    """
    The event page calls this after Paystack redirects back with ?reference=... .
    It asks Paystack directly, so it works even if the webhook is late, and never trusts the redirect.
    Guest tickets are confirmed by whoever holds the (unguessable) reference, i.e. the buyer's browser;
    member tickets only by that member.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "paystack_verify"

    def get(self, request, reference):
        payment = TicketPayment.objects.filter(reference=reference).select_related("registration").first()
        owner_id = payment.registration.user_id if payment and payment.registration else None
        if payment is None or payment.registration is None or (
            owner_id is not None and owner_id != getattr(request.user, "pk", None)
        ):
            return Response({"detail": "Payment not found."}, status=404)
        try:
            payment = settle_payment(reference)
        except PaystackError as exc:
            logger.error("Paystack verify failed for %s: %s", reference, exc)
            return Response({"detail": "We couldn't confirm the payment yet. Please refresh in a moment."}, status=502)

        registration = EventRegistration.objects.get(pk=payment.registration_id)
        response = registration_response(registration)
        response.data["payment_status"] = payment.status
        return response


class PaystackWebhookView(APIView):
    """Set https://<api-host>/api/payments/paystack/webhook/ as the webhook URL in the Paystack dashboard."""

    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def post(self, request):
        raw_body = request.body  # read before request.data so the exact signed bytes are kept
        if not is_valid_webhook_signature(raw_body, request.headers.get("x-paystack-signature")):
            logger.warning("Rejected Paystack webhook with invalid signature")
            return Response({"detail": "Invalid signature"}, status=401)

        try:
            body = json.loads(raw_body)
        except ValueError:
            return Response({"detail": "Invalid JSON"}, status=400)

        event_type = body.get("event")
        data = body.get("data") if isinstance(body.get("data"), dict) else {}
        transaction_data = data.get("transaction") if isinstance(data.get("transaction"), dict) else {}

        try:
            if event_type == "charge.success":
                reference = data.get("reference")
                # Re-verifies with Paystack and is idempotent, so repeated webhooks are harmless.
                handled = settle_payment(reference) if reference else None
            elif event_type == "refund.processed":
                reference = data.get("transaction_reference") or transaction_data.get("reference")
                handled = handle_refund(reference, data.get("amount")) if reference else None
            elif event_type in ("charge.dispute.create", "charge.dispute.remind"):
                reference = transaction_data.get("reference") or data.get("transaction_reference")
                handled = handle_dispute(reference) if reference else None
            else:
                return Response({"detail": "Ignored"}, status=200)
        except PaystackError as exc:
            logger.error("Paystack webhook %s processing failed: %s", event_type, exc)
            # Non-200 so Paystack retries later. Any other error also returns 500 and is retried.
            return Response({"detail": "Processing failed"}, status=500)

        if handled is None:
            # Not one of our ticket payments (e.g. another product on the same Paystack account).
            return Response({"detail": "Unknown reference"}, status=200)
        return Response({"detail": "Processed"}, status=200)


class TicketView(APIView):
    """
    The holder's ticket page (QR code), opened from the link in the ticket email. Works without signing
    in: the token in the URL is the ticket itself, the same secret the QR code holds.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        registration = (
            EventRegistration.objects.select_related("event", "ticket_type")
            .filter(token=token, status=EventRegistration.Status.CONFIRMED).first()
        )
        if registration is None:
            return Response({"detail": "Ticket not found."}, status=404)
        event = registration.event
        data = EventRegistrationSerializer(registration).data
        data["name"] = registration.name
        data["email"] = registration.email
        data["event"] = {
            "id": event.pk,
            "title": event.title,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "location": event.location,
            "is_remote": event.is_remote,
            "poster": event.poster_url or None,
        }
        return Response(data)
