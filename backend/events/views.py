from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import filters, mixins, permissions, viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsAdmin
from projects.permissions import IsAdminOrReadOnly

from .filters import EventFilter
from .models import Event, EventRegistration
from .serializers import (
    AdminEventRegistrationSerializer,
    EventRegistrationSerializer,
    EventSerializer,
)


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
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        # Staff sees everything; public sees published only.
        qs = (
            Event.objects.all()
            if (self.request.user.is_authenticated and self.request.user.is_staff)
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

        return qs

    @action(detail=True, methods=["post"], url_path="register")
    def register(self, request, pk=None):
        event = self.get_object()
        if event.status == "completed":
            return Response({"detail": "Registration is closed for this event."}, status=400)
        registration, created = EventRegistration.objects.get_or_create(event=event, user=request.user)
        return Response(
            EventRegistrationSerializer(registration).data,
            status=201 if created else 200,
        )

    @action(detail=True, methods=["get"], url_path="my-registration")
    def my_registration(self, request, pk=None):
        event = self.get_object()
        try:
            registration = EventRegistration.objects.get(event=event, user=request.user)
        except EventRegistration.DoesNotExist:
            return Response({"detail": "Not registered for this event."}, status=404)
        return Response(EventRegistrationSerializer(registration).data)


class AdminEventRegistrationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Admin-only roster + check-in actions for event attendance."""

    queryset = (
        EventRegistration.objects.select_related("event", "user", "checked_in_by")
        .order_by("-created_at")
    )
    serializer_class = AdminEventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
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
        self.get_object()  # 404s cleanly if pk doesn't exist / permission fails
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
