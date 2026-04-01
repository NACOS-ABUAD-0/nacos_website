# backend/gallery/views.py
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from .models import GalleryImage
from .serializers import GalleryImageSerializer


class GalleryImageViewSet(viewsets.ModelViewSet):
    serializer_class = GalleryImageSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_published', 'category']
    search_fields = ['caption', 'alt_text', 'category']
    ordering_fields = ['display_order', 'created_at']
    ordering = ['display_order', '-created_at']

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return GalleryImage.objects.all()
        return GalleryImage.objects.filter(is_published=True)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
