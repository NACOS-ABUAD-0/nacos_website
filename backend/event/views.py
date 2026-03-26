from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from projects.permissions import IsAdminOrReadOnly
from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.filter(is_published=True)
    serializer_class = EventSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_published']
    search_fields = ['name', 'location', 'description']
    ordering_fields = ['start_time', 'end_time', 'created_at', 'name']
    ordering = ['start_time']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return Event.objects.all()
        return qs
