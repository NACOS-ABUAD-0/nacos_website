from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated, SAFE_METHODS
from rest_framework.permissions import BasePermission
from django_filters.rest_framework import DjangoFilterBackend
from .models import GalleryImage
from .serializers import GalleryImageSerializer


class IsStaffOrReadOnly(BasePermission):
    """Allow anyone to read; restrict writes to staff users."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.is_staff


class GalleryImageViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.all()          # ← required for DRF router
    serializer_class = GalleryImageSerializer
    permission_classes = [IsStaffOrReadOnly]        # ← reads: public; writes: staff only
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_published', 'category']
    search_fields = ['caption', 'alt_text', 'category']
    ordering_fields = ['display_order', 'created_at']
    ordering = ['display_order', '-created_at']

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return GalleryImage.objects.all()
        return GalleryImage.objects.filter(is_published=True)