from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import mixins, permissions, viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin

from .models import ClassAttendance, ClassSession
from .serializers import ClassSessionDetailSerializer, ClassSessionSerializer


class ClassSessionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = ClassSession.objects.select_related('created_by').prefetch_related('attendances__student')
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    # Small, bounded admin-facing history list — no need to paginate.
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['course_code']

    def get_serializer_class(self):
        return ClassSessionDetailSerializer if self.action == 'retrieve' else ClassSessionSerializer

    def perform_create(self, serializer):
        # Auto-close any still-open session for this course so a forgotten
        # QR from an earlier session can never coexist with (or be mistaken
        # for) the new one.
        course_code = serializer.validated_data['course_code']
        ClassSession.objects.filter(course_code=course_code, closed_at__isnull=True).update(
            closed_at=timezone.now()
        )
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='close')
    def close(self, request, pk=None):
        session = self.get_object()
        if session.is_open:
            session.closed_at = timezone.now()
            session.save(update_fields=['closed_at'])
        return Response(ClassSessionDetailSerializer(session).data)


class ScanAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'token is required.'}, status=400)
        try:
            session = ClassSession.objects.get(token=token)
        except (ClassSession.DoesNotExist, ValueError, DjangoValidationError):
            return Response({'detail': 'Invalid QR code.'}, status=404)
        if not session.is_open:
            return Response(
                {'detail': 'This session has been closed. Ask your lecturer for a new QR code.'},
                status=400,
            )
        attendance, created = ClassAttendance.objects.get_or_create(session=session, student=request.user)
        return Response(
            {'status': 'recorded' if created else 'already_recorded', 'course_code': session.course_code},
            status=201 if created else 200,
        )
