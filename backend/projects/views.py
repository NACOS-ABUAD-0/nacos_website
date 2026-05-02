# path: backend/projects/views.py
import logging

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Exists, OuterRef, Value, BooleanField

from .models import Project, SkillTag, Like, CollaborationNeed, CollaborationRequest
from .serializers import (
    ProjectSerializer,
    SkillTagSerializer,
    CollaborationNeedSerializer,
    CollaborationRequestSerializer,
)
from .permissions import IsOwnerOrReadOnly

logger = logging.getLogger(__name__)


class SkillTagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SkillTag.objects.all()
    serializer_class = SkillTagSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["tags", "owner", "is_featured"]
    search_fields = ["title", "description", "tags__name"]
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-created_at"]

    # ── Queryset ──────────────────────────────────────────────────────────────

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
            queryset = queryset.annotate(
                is_liked_by_user=Value(False, output_field=BooleanField())
            )

        # BUG 3 FIX: needs_help filter is correct; no unintentional user filter.
        needs_help = self.request.query_params.get("needs_help", None)
        if needs_help in ("true", "1", "True"):
            queryset = queryset.filter(
                collaboration_needs__is_filled=False
            ).distinct()

        skill_type = self.request.query_params.get("skill_type", None)
        if skill_type:
            queryset = queryset.filter(
                collaboration_needs__skill_type=skill_type,
                collaboration_needs__is_filled=False,
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

        return queryset.select_related('owner').prefetch_related(
            'tags', 'collaboration_needs'
        )

    # ── BUG 2 FIX: Explicit ownership enforcement on all mutating operations ──
    # DRF's check_object_permissions() via get_object() should catch this,
    # but we add an explicit guard as a second layer of defence.

    def _assert_owner(self, request, instance):
        """Raises 403 if the requesting user is not the project owner (or staff)."""
        if instance.owner != request.user and not request.user.is_staff:
            return Response(
                {"error": "You do not have permission to modify this project."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def update(self, request, *args, **kwargs):
        instance = self.get_object()          # triggers check_object_permissions
        denial = self._assert_owner(request, instance)
        if denial:
            return denial
        kwargs['partial'] = kwargs.get('partial', False)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()          # triggers check_object_permissions
        denial = self._assert_owner(request, instance)
        if denial:
            return denial
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # ── Like / Unlike ─────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        project = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, project=project)
        if created:
            return Response({'status': 'liked', 'like_count': project.likes.count()})
        return Response(
            {'error': 'You have already liked this project.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unlike(self, request, pk=None):
        project = self.get_object()
        deleted, _ = Like.objects.filter(user=request.user, project=project).delete()
        if deleted:
            return Response({'status': 'unliked', 'like_count': project.likes.count()})
        return Response(
            {'error': 'You have not liked this project.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    @action(
        detail=False, methods=["get"],
        permission_classes=[IsAuthenticated],
        url_path='liked',
    )
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

    # ── My Projects ───────────────────────────────────────────────────────────

    @action(
        detail=False, methods=["get"],
        permission_classes=[IsAuthenticated],
        url_path='my-projects',
    )
    def my_projects(self, request):
        """All projects owned by the requesting user (includes drafts)."""
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

    # ── Toggle Featured ───────────────────────────────────────────────────────

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def toggle_featured(self, request, pk=None):
        project = self.get_object()
        if request.user.is_staff:
            project.is_featured = not project.is_featured
            project.save()
            return Response({"is_featured": project.is_featured})
        return Response(
            {"error": "Only admins can feature projects."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # ── Collaboration: Apply ──────────────────────────────────────────────────

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def apply_collaborate(self, request, pk=None):
        """
        A student applies to collaborate on a project.

        BUG 4 FIX — duplicate check:
        The check is scoped to (project, applicant), NOT just (applicant,).
        A user can apply to as many DIFFERENT projects as they like; they
        simply cannot submit a second request to the SAME project.
        """
        project = self.get_object()

        # Owners cannot apply to their own project.
        if project.owner == request.user:
            return Response(
                {"error": "You cannot apply to collaborate on your own project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # BUG 4 FIX: Scope the existence check to THIS project + THIS user.
        if CollaborationRequest.objects.filter(
            project=project, applicant=request.user
        ).exists():
            return Response(
                {"error": "You have already submitted a collaboration request for this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Resolve optional need reference.
        need = None
        need_id = request.data.get('need_id')
        if need_id:
            try:
                need = project.collaboration_needs.get(id=need_id, is_filled=False)
            except CollaborationNeed.DoesNotExist:
                return Response(
                    {"error": "That collaboration need does not exist or has already been filled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = CollaborationRequestSerializer(
            data=request.data, context={'request': request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        collab_request = serializer.save(
            project=project,
            applicant=request.user,
            need=need,
        )

        # BUG 4 FIX: Notify the project owner so they can see the request.
        self._notify_owner_of_request(project, request.user, collab_request)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _notify_owner_of_request(project, applicant, collab_request):
        """Create an in-app notification for the project owner (non-fatal)."""
        try:
            from accounts.models import Notification
            Notification.objects.create(
                user=project.owner,
                title="New Collaboration Request",
                message=(
                    f"{applicant.full_name} wants to collaborate on "
                    f"'{project.title}'."
                ),
                notification_type='system',
                data={
                    'type': 'collaboration_request',
                    'project_id': project.id,
                    'project_title': project.title,
                    'request_id': collab_request.id,
                    'applicant_name': applicant.full_name,
                    'applicant_email': applicant.email,
                },
            )
        except Exception:
            # Never let notification failure break the main request flow.
            logger.warning(
                "Failed to create collaboration notification for project %s",
                project.id,
                exc_info=True,
            )

    # ── Collaboration: View Requests (owner) ──────────────────────────────────

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def collaboration_requests(self, request, pk=None):
        """Project owner views all incoming collaboration requests."""
        project = self.get_object()

        if project.owner != request.user and not request.user.is_staff:
            return Response(
                {"error": "Only the project owner can view collaboration requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        requests_qs = (
            project.collaboration_requests
            .select_related('applicant', 'need')
            .all()
        )
        # Return paginated so large projects don't blow the response.
        page = self.paginate_queryset(requests_qs)
        if page is not None:
            serializer = CollaborationRequestSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = CollaborationRequestSerializer(requests_qs, many=True)
        return Response(serializer.data)

    # ── Collaboration: Accept ─────────────────────────────────────────────────

    @action(
        detail=True, methods=['patch'],
        permission_classes=[IsAuthenticated],
        url_path=r'requests/(?P<request_id>[^/.]+)/accept',
    )
    def accept_request(self, request, pk=None, request_id=None):
        """Project owner accepts a collaboration request."""
        project = self.get_object()

        if project.owner != request.user and not request.user.is_staff:
            return Response(
                {"error": "Only the project owner can accept requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            collab_request = project.collaboration_requests.get(id=request_id)
        except CollaborationRequest.DoesNotExist:
            return Response(
                {"error": "Collaboration request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        collab_request.status = 'accepted'
        collab_request.save(update_fields=['status', 'updated_at'])

        # Mark the specific need as filled if one was referenced.
        if collab_request.need and not collab_request.need.is_filled:
            collab_request.need.is_filled = True
            collab_request.need.save(update_fields=['is_filled'])

        # Notify the applicant.
        try:
            from accounts.models import Notification
            Notification.objects.create(
                user=collab_request.applicant,
                title="Collaboration Request Accepted",
                message=f"Your request to collaborate on '{project.title}' was accepted!",
                notification_type='system',
                data={
                    'type': 'collaboration_accepted',
                    'project_id': project.id,
                    'project_title': project.title,
                },
            )
        except Exception:
            logger.warning(
                "Failed to notify applicant %s of acceptance", collab_request.applicant_id,
                exc_info=True,
            )

        return Response({"status": "accepted"})

    # ── Collaboration: Reject ─────────────────────────────────────────────────

    @action(
        detail=True, methods=['patch'],
        permission_classes=[IsAuthenticated],
        url_path=r'requests/(?P<request_id>[^/.]+)/reject',
    )
    def reject_request(self, request, pk=None, request_id=None):
        """Project owner rejects a collaboration request."""
        project = self.get_object()

        if project.owner != request.user and not request.user.is_staff:
            return Response(
                {"error": "Only the project owner can reject requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            collab_request = project.collaboration_requests.get(id=request_id)
        except CollaborationRequest.DoesNotExist:
            return Response(
                {"error": "Collaboration request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        collab_request.status = 'rejected'
        collab_request.save(update_fields=['status', 'updated_at'])

        # Notify the applicant.
        try:
            from accounts.models import Notification
            Notification.objects.create(
                user=collab_request.applicant,
                title="Collaboration Request Update",
                message=(
                    f"Your request to collaborate on '{project.title}' "
                    f"was not accepted this time."
                ),
                notification_type='system',
                data={
                    'type': 'collaboration_rejected',
                    'project_id': project.id,
                    'project_title': project.title,
                },
            )
        except Exception:
            logger.warning(
                "Failed to notify applicant %s of rejection", collab_request.applicant_id,
                exc_info=True,
            )

        return Response({"status": "rejected"})

    # ── My Collaborations ─────────────────────────────────────────────────────

    @action(
        detail=False, methods=['get'],
        permission_classes=[IsAuthenticated],
        url_path='my-collaborations',
    )
    def my_collaborations(self, request):
        """
        Projects the requesting user is actively collaborating on
        (i.e., their collaboration request was accepted).
        """
        projects = (
            Project.objects
            .filter(
                collaboration_requests__applicant=request.user,
                collaboration_requests__status='accepted',
            )
            .select_related("owner")
            .prefetch_related("tags")
            .annotate(like_count=Count('likes', distinct=True))
            .annotate(
                is_liked_by_user=Exists(
                    Like.objects.filter(user=request.user, project=OuterRef('pk'))
                )
            )
            .distinct()
            .order_by("-collaboration_requests__updated_at")
        )
        page = self.paginate_queryset(projects)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)