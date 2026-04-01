# backend/projects/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Exists, OuterRef, Value, BooleanField

from .models import Project, SkillTag, Like
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
        queryset = Project.objects.filter(status="published")

        # Annotate with total like count
        queryset = queryset.annotate(like_count=Count('likes', distinct=True))

        # Annotate with whether the current user liked it
        user = self.request.user
        if user.is_authenticated:
            queryset = queryset.annotate(
                is_liked_by_user=Exists(
                    Like.objects.filter(user=user, project=OuterRef('pk'))
                )
            )
        else:
            queryset = queryset.annotate(is_liked_by_user=Value(False, output_field=BooleanField()))

        # Apply filters (search, tag_names) – keep existing logic
        search_query = self.request.query_params.get("search", None)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query)
                | Q(description__icontains=search_query)
                | Q(tags__name__icontains=search_query)
            ).distinct()

        tag_names = self.request.query_params.get("tag_names", None)
        if tag_names:
            tag_list = [tag.strip() for tag in tag_names.split(",")]
            queryset = queryset.filter(tags__name__in=tag_list).distinct()

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        project = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, project=project)
        if created:
            return Response({'status': 'liked', 'like_count': project.likes.count()})
        return Response(
            {'error': 'You have already liked this project.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unlike(self, request, pk=None):
        project = self.get_object()
        deleted, _ = Like.objects.filter(user=request.user, project=project).delete()
        if deleted:
            return Response({'status': 'unliked', 'like_count': project.likes.count()})
        return Response(
            {'error': 'You have not liked this project.'},
            status=status.HTTP_400_BAD_REQUEST
        )

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

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path='my-projects')
    def my_projects(self, request):
        projects = (
            Project.objects
            .filter(owner=request.user)
            .select_related("owner")
            .prefetch_related("tags")
            .order_by("-created_at")
        )
        page = self.paginate_queryset(projects)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)