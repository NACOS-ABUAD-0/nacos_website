# backend/resources/views.py
import hashlib
import time
import uuid

from django.conf import settings
from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from accounts.permissions import IsAdmin
from .models import Resource, ResourceCategory, ResourceTag, ResourceDownload
from .serializers import (
    ResourceSerializer, ResourceDetailSerializer,
    ResourceCategorySerializer, ResourceTagSerializer,
    ResourceSubmitSerializer, AdminResourceSerializer,
)

import json
from pathlib import Path
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny


class ResourceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ResourceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'course_code', 'year', 'tags']
    search_fields = ['title', 'description', 'course_code', 'tags__name']
    ordering_fields = ['title', 'created_at', 'download_count', 'file_size']
    ordering = ['-created_at']

    def get_queryset(self):
        # status defaults to APPROVED for every existing/Drive-synced/admin
        # row, so this is a no-op for them — only PENDING/REJECTED student
        # submissions get excluded here.
        queryset = Resource.objects.filter(is_public=True, status=Resource.Status.APPROVED)

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


class ResourceCountView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        count = Resource.objects.count()
        return Response({'count': count})


class DriveResourcesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        json_path = Path(__file__).resolve().parent.parent / "resources_data.json"
        if not json_path.exists():
            return Response({"error": "Resources not yet synced."}, status=503)
        with json_path.open() as f:
            data = json.load(f)
        return Response(data)


class ResourceSubmitView(APIView):
    """
    POST /api/resources/submit/
    Students submit a resource they've already uploaded to Cloudinary
    (see cloudinary_sign_resource). Starts PENDING — invisible in the
    public list until an admin approves it.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'resource_submit'

    def post(self, request):
        serializer = ResourceSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        resource = serializer.save(
            submitted_by=request.user,
            status=Resource.Status.PENDING,
            drive_file_id=f"upload-{uuid.uuid4()}",
        )
        return Response(ResourceSerializer(resource).data, status=status.HTTP_201_CREATED)


class AdminResourceViewSet(viewsets.ModelViewSet):
    """Full CRUD + moderation for admins, at /api/admin/resources/."""
    queryset = Resource.objects.all().select_related('category', 'submitted_by').prefetch_related('tags')
    serializer_class = AdminResourceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'category']

    def perform_create(self, serializer):
        # Admin-authored resources need a drive_file_id too (unique, no
        # real Drive file behind them) and are approved immediately.
        serializer.save(
            drive_file_id=f"admin-{uuid.uuid4()}",
            status=Resource.Status.APPROVED,
        )

    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        resource = self.get_object()
        resource.status = Resource.Status.APPROVED
        resource.admin_note = request.data.get('admin_note', resource.admin_note)
        resource.save(update_fields=['status', 'admin_note', 'updated_at'])
        return Response(AdminResourceSerializer(resource).data)

    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        resource = self.get_object()
        resource.status = Resource.Status.REJECTED
        resource.admin_note = request.data.get('admin_note', resource.admin_note)
        resource.save(update_fields=['status', 'admin_note', 'updated_at'])
        return Response(AdminResourceSerializer(resource).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cloudinary_sign_resource(request):
    """
    Same signed-upload pattern as projects.views.cloudinary_sign, but for
    resource files (PDFs/docs/zips, not images) — signs a separate folder
    so the existing project-image upload path is untouched.
    """
    cloud_name = settings.CLOUDINARY_CLOUD_NAME
    api_key = settings.CLOUDINARY_API_KEY
    api_secret = settings.CLOUDINARY_API_SECRET
    if not all([cloud_name, api_key, api_secret]):
        return Response(
            {"detail": "Cloudinary is not configured on the server."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    folder = settings.CLOUDINARY_RESOURCES_FOLDER
    timestamp = int(time.time())
    params_to_sign = {"folder": folder, "timestamp": timestamp}
    signature_base = "&".join(
        f"{key}={params_to_sign[key]}" for key in sorted(params_to_sign)
    )
    signature = hashlib.sha1(
        f"{signature_base}{api_secret}".encode("utf-8")
    ).hexdigest()

    return Response({
        "cloud_name": cloud_name,
        "api_key": api_key,
        "timestamp": timestamp,
        "signature": signature,
        "folder": folder,
    })
