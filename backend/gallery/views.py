from rest_framework import viewsets, filters, parsers
from django_filters.rest_framework import DjangoFilterBackend

from projects.permissions import IsAdminOrReadOnly
from .models import GalleryImage
from .serializers import GalleryImageSerializer


class GalleryImageViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.filter(is_published=True)
    serializer_class = GalleryImageSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_published']
    ordering_fields = ['display_order', 'created_at']
    ordering = ['display_order', '-created_at']

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return GalleryImage.objects.all()
        return super().get_queryset()
