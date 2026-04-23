# backend/projects/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Exists, OuterRef, Value, BooleanField

from .models import Project, SkillTag, Like, CollaborationNeed, CollaborationRequest
from .serializers import (
    ProjectSerializer, SkillTagSerializer,
    CollaborationNeedSerializer, CollaborationRequestSerializer
)
from .permissions import IsOwnerOrReadOnly


class SkillTagViewSet(viewsets.ReadOnlyModelViewSet):
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
        queryset = queryset.annotate(like_count=Count('likes', distinct=True))

        user = self.request.user
        if user.is_authenticated:
            queryset = queryset.annotate(
                is_liked_by_user=Exists(
                    Like.objects.filter(user=user, project=OuterRef('pk'))
                )
            )
        else:
            queryset = queryset.annotate(is_liked_by_user=Value(False, output_field=BooleanField()))

        # Filter by collaboration needs
        needs_help = self.request.query_params.get("needs_help", None)
        if needs_help == "true":
            queryset = queryset.filter(
                collaboration_needs__is_filled=False
            ).distinct()

        # Filter by skill type needed
        skill_type = self.request.query_params.get("skill_type", None)
        if skill_type:
            queryset = queryset.filter(
                collaboration_needs__skill_type=skill_type,
                collaboration_needs__is_filled=False
            ).distinct()

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

        return queryset.select_related('owner').prefetch_related('tags', 'collaboration_needs')

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

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path='liked')
    def liked_projects(self, request):
        projects = (
            Project.objects
            .filter(likes__user=request.user)
            .select_related("owner")
            .prefetch_related("tags")
            .annotate(like_count=Count('likes', distinct=True))
            .annotate(is_liked_by_user=Value(True, output_field=BooleanField()))
            .order_by("-likes__created_at")
        )
        page = self.paginate_queryset(projects)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    # ─── Collaboration Endpoints ─────────────────────────────────────────────

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def apply_collaborate(self, request, pk=None):
        """Student applies to collaborate on a project."""
        project = self.get_object()

        # Prevent owner from applying to own project
        if project.owner == request.user:
            return Response(
                {"error": "You cannot apply to collaborate on your own project."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for duplicate application
        if CollaborationRequest.objects.filter(
            project=project, applicant=request.user
        ).exists():
            return Response(
                {"error": "You have already applied to collaborate on this project."},
                status=status.HTTP_400_BAD_REQUEST
            )

        need_id = request.data.get('need_id')
        need = None
        if need_id:
            try:
                need = project.collaboration_needs.get(id=need_id, is_filled=False)
            except CollaborationNeed.DoesNotExist:
                return Response(
                    {"error": "Invalid or already filled collaboration need."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = CollaborationRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project=project,
                applicant=request.user,
                need=need
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def collaboration_requests(self, request, pk=None):
        """Project owner views all collaboration requests."""
        project = self.get_object()

        # Only owner can view requests
        if project.owner != request.user and not request.user.is_staff:
            return Response(
                {"error": "Only the project owner can view collaboration requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        requests = project.collaboration_requests.select_related('applicant', 'need').all()
        serializer = CollaborationRequestSerializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated], url_path='requests/(?P<request_id>[^/.]+)/accept')
    def accept_request(self, request, pk=None, request_id=None):
        """Project owner accepts a collaboration request."""
        project = self.get_object()

        if project.owner != request.user and not request.user.is_staff:
            return Response(
                {"error": "Only the project owner can accept requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            collab_request = project.collaboration_requests.get(id=request_id)
        except CollaborationRequest.DoesNotExist:
            return Response(
                {"error": "Request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        collab_request.status = 'accepted'
        collab_request.save()

        # Mark the need as filled if specified
        if collab_request.need:
            collab_request.need.is_filled = True
            collab_request.need.save()

        return Response({"status": "accepted"})

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated], url_path='requests/(?P<request_id>[^/.]+)/reject')
    def reject_request(self, request, pk=None, request_id=None):
        """Project owner rejects a collaboration request."""
        project = self.get_object()

        if project.owner != request.user and not request.user.is_staff:
            return Response(
                {"error": "Only the project owner can reject requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            collab_request = project.collaboration_requests.get(id=request_id)
        except CollaborationRequest.DoesNotExist:
            return Response(
                {"error": "Request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        collab_request.status = 'rejected'
        collab_request.save()
        return Response({"status": "rejected"})

    # ─── My Collaborations ─────────────────────────────────────────────────────

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='my-collaborations')
    def my_collaborations(self, request):
        """Projects the user is collaborating on (accepted requests)."""
        projects = (
            Project.objects
            .filter(collaboration_requests__applicant=request.user, collaboration_requests__status='accepted')
            .select_related("owner")
            .prefetch_related("tags")
            .annotate(like_count=Count('likes', distinct=True))
            .annotate(is_liked_by_user=Exists(
                Like.objects.filter(user=request.user, project=OuterRef('pk'))
            ))
            .order_by("-collaboration_requests__updated_at")
        )
        page = self.paginate_queryset(projects)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

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