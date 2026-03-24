from rest_framework import viewsets, filters, parsers
from django_filters.rest_framework import DjangoFilterBackend

from projects.permissions import IsAdminOrReadOnly
from .models import Executive
from .serializers import ExecutiveSerializer


class ExecutiveViewSet(viewsets.ModelViewSet):
    queryset = Executive.objects.filter(is_active=True)
    serializer_class = ExecutiveSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'title', 'job_description', 'email']
    ordering_fields = ['display_order', 'name', 'created_at']
    ordering = ['display_order', 'name']

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return Executive.objects.all()
        return super().get_queryset()
