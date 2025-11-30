# backend/resources/views.py
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from .models import Resource, ResourceCategory, ResourceTag
from .serializers import (
    ResourceSerializer, ResourceDetailSerializer,
    ResourceCategorySerializer, ResourceTagSerializer
)


class ResourceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ResourceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'course_code', 'year', 'tags']
    search_fields = ['title', 'description', 'course_code', 'tags__name']
    ordering_fields = ['title', 'created_at', 'download_count', 'file_size']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Resource.objects.filter(is_public=True)

        # Filter by search query
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(course_code__icontains=search) |
                Q(tags__name__icontains=search)
            ).distinct()

        # Filter by recent (last 30 days)
        recent = self.request.query_params.get('recent', None)
        if recent:
            thirty_days_ago = timezone.now() - timedelta(days=30)
            queryset = queryset.filter(created_at__gte=thirty_days_ago)

        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ResourceDetailSerializer
        return ResourceSerializer

    @action(detail=True, methods=['post'])
    def track_download(self, request, pk=None):
        """Track resource downloads"""
        resource = self.get_object()

        # Increment download count
        resource.download_count += 1
        resource.save()

        # Create download record
        ResourceDownload.objects.create(
            resource=resource,
            user=request.user if request.user.is_authenticated else None,
            ip_address=self.get_client_ip(request)
        )

        return Response({
            'download_url': resource.download_url or resource.url,
            'download_count': resource.download_count
        })

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ResourceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ResourceCategory.objects.all()
    serializer_class = ResourceCategorySerializer
    pagination_class = None


class ResourceTagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ResourceTag.objects.all()
    serializer_class = ResourceTagSerializer
    pagination_class = None