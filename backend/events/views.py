from django.utils import timezone
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny

from .filters import EventFilter
from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    # Use the explicit FilterSet so DjangoFilterBackend never sees (and
    # rejects) the `status` or `upcoming` query params that we handle
    # manually below.
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EventFilter

    search_fields = ["title", "location", "description"]
    ordering_fields = ["start_time", "end_time", "created_at", "title"]
    ordering = ["start_time"]

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