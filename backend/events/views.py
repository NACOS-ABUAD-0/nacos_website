import json
import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import filters, mixins, permissions, viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminOrExecutive

from .filters import EventFilter
from .models import Event, EventRegistration, TicketPayment
from .paystack import PaystackError, is_valid_webhook_signature
from .serializers import (
    AdminEventRegistrationSerializer,
    EventRegistrationSerializer,
    EventSerializer,
    TicketTypeBriefSerializer,
)
from .ticketing import RegistrationError, open_checkout, register, settle_payment, settle_pending_payments

logger = logging.getLogger(__name__)


def can_manage_events(user) -> bool:
    """Admin-tier staff (Admin, Super Admin, Lecturer) and every exco can upload, edit and delete events."""
    return bool(user and user.is_authenticated and (user.is_admin or user.is_executive))


class IsEventManagerOrReadOnly(permissions.BasePermission):
    message = "Only admins and excos can manage events."

    def has_permission(self, request, view) -> bool:
        return request.method in permissions.SAFE_METHODS or can_manage_events(request.user)


def registration_response(registration, payment=None, status=200):
    """The student's registration, plus the Paystack checkout to continue when payment is pending."""
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
        if self.action in ("register", "my_registration"):
            return [permissions.IsAuthenticated()]
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

    def destroy(self, request, *args, **kwargs):
        event = self.get_object()
        paid = TicketPayment.objects.filter(event=event, status=TicketPayment.Status.SUCCESSFUL).count()
        if paid:
            return Response(
                {"detail": f"{paid} people have paid for tickets to this event, so it can't be deleted. "
                           f"Unpublish it instead, and refund them in Paystack if it's cancelled."},
                status=409,
            )
        with transaction.atomic():
            # Unpaid checkout records only; they would otherwise block the delete.
            TicketPayment.objects.filter(event=event).delete()
            event.delete()
        return Response(status=204)

    @action(detail=True, methods=["post"], url_path="register")
    def register(self, request, pk=None):
        """
        Body: { "ticket_type": <id> } — required when the event has more than one ticket type.
        Free tickets (and events without ticket types) are confirmed straight away. Paid tickets return
        a Paystack checkout_url; the registration stays pending_payment (no QR) until Paystack confirms.
        """
        event = self.get_object()
        if event.status == "completed":
            return Response({"detail": "Registration is closed for this event."}, status=400)

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
            registration, payment, created = register(event, request.user, ticket_type)
        except RegistrationError as exc:
            return Response({"detail": exc.detail, "code": exc.code}, status=exc.status)
        except PaystackError:
            return Response({"detail": "We couldn't start the payment. Please try again in a moment."}, status=502)

        return registration_response(registration, payment, status=201 if created else 200)

    @action(detail=True, methods=["get"], url_path="my-registration")
    def my_registration(self, request, pk=None):
        event = self.get_object()
        try:
            registration = EventRegistration.objects.get(event=event, user=request.user)
        except EventRegistration.DoesNotExist:
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
    search_fields = ["user__full_name", "user__email", "user__matric_number"]

    def _perform_check_in(self, registration_pk):
        with transaction.atomic():
            registration = EventRegistration.objects.select_for_update().get(pk=registration_pk)
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
        token = request.data.get("token")
        event_id = request.data.get("event")
        if not token or not event_id:
            return Response({"detail": "token and event are required."}, status=400)
        try:
            registration = EventRegistration.objects.get(token=token, event_id=event_id)
        except (EventRegistration.DoesNotExist, ValueError, DjangoValidationError):
            return Response({"detail": "No matching registration found for this event."}, status=404)
        return self._perform_check_in(registration.pk)


class PaystackVerifyView(APIView):
    """
    The event page calls this after Paystack redirects back with ?reference=... .
    It asks Paystack directly, so it works even if the webhook is late, and never trusts the redirect.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reference):
        payment = TicketPayment.objects.filter(reference=reference).select_related("registration").first()
        if payment is None or payment.registration is None or payment.registration.user_id != request.user.pk:
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

        reference = (body.get("data") or {}).get("reference")
        if body.get("event") != "charge.success" or not reference:
            return Response({"detail": "Ignored"}, status=200)

        try:
            # Re-verifies with Paystack and is idempotent, so repeated webhooks are harmless.
            if settle_payment(reference) is None:
                return Response({"detail": "Unknown reference"}, status=200)
        except PaystackError as exc:
            logger.error("Paystack webhook processing failed for %s: %s", reference, exc)
            # Non-200 so Paystack retries later.
            return Response({"detail": "Processing failed"}, status=500)
        return Response({"detail": "Processed"}, status=200)
