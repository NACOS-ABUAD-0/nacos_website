# backend/projects/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Project, SkillTag
from .serializers import ProjectSerializer, SkillTagSerializer
from .permissions import IsOwnerOrReadOnly


class SkillTagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only endpoint for listing skill tags.
    """
    queryset = SkillTag.objects.all()
    serializer_class = SkillTagSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.filter(status="published")
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["tags", "owner", "is_featured"]
    search_fields = ["title", "description", "tags__name"]
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()

        # 🔍 Filter by search query
        search_query = self.request.query_params.get("search", None)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query)
                | Q(description__icontains=search_query)
                | Q(tags__name__icontains=search_query)
            ).distinct()

        # 🔍 Filter by tag names (comma-separated)
        tag_names = self.request.query_params.get("tag_names", None)
        if tag_names:
            tag_list = [tag.strip() for tag in tag_names.split(",")]
            queryset = queryset.filter(tags__name__in=tag_list).distinct()

        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def toggle_featured(self, request, pk=None):
        project = self.get_object()
        if request.user.is_staff:
            project.is_featured = not project.is_featured
            project.save()
            return Response({"is_featured": project.is_featured})
        return Response(
            {"error": "Only admins can feature projects"},
            status=status.HTTP_403_FORBIDDEN,
        )

    @action(detail=False, methods=["get"])
    def my_projects(self, request):
        projects = Project.objects.filter(owner=request.user)
        page = self.paginate_queryset(projects)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)


