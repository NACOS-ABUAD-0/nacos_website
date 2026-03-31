from io import BytesIO

import qrcode  # type: ignore
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from projects.permissions import IsAdminOrReadOnly
from .models import Event, EventAttendance
from .serializers import (
    EventSerializer,
    EventAttendanceSerializer,
    RegisterEventAttendeeSerializer,
    EventCheckInSerializer,
)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.filter(is_published=True)
    serializer_class = EventSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_published']
    search_fields = ['name', 'location', 'description']
    ordering_fields = ['start_time', 'end_time', 'created_at', 'name']
    ordering = ['start_time']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return Event.objects.all()
        return qs

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def attendees(self, request, pk=None):
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admins can view event attendees.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        event = self.get_object()
        queryset = event.attendances.select_related('student', 'checked_in_by')
        serializer = EventAttendanceSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def register_attendee(self, request, pk=None):
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admins can register attendees.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        event = self.get_object()
        serializer = RegisterEventAttendeeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attendance, created = EventAttendance.objects.get_or_create(
            event=event,
            student=serializer.validated_data['student'],
        )

        payload = {
            'event_id': event.id,
            'check_in_token': str(attendance.check_in_token),
            'qr_value': f'event:{event.id}:token:{attendance.check_in_token}',
        }
        return Response(
            {
                'created': created,
                'attendance': EventAttendanceSerializer(attendance).data,
                'payload': payload,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def my_qr(self, request, pk=None):
        event = self.get_object()
        attendance = EventAttendance.objects.filter(event=event, student=request.user).first()
        if not attendance:
            return Response(
                {'error': 'You are not registered for this event.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                'attendance': EventAttendanceSerializer(attendance).data,
                'payload': {
                    'event_id': event.id,
                    'check_in_token': str(attendance.check_in_token),
                    'qr_value': f'event:{event.id}:token:{attendance.check_in_token}',
                },
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def my_qr_png(self, request, pk=None):
        event = self.get_object()
        attendance = EventAttendance.objects.filter(event=event, student=request.user).first()
        if not attendance:
            return Response(
                {'error': 'You are not registered for this event.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        qr_value = f'event:{event.id}:token:{attendance.check_in_token}'
        qr_image = qrcode.make(qr_value)
        buffer = BytesIO()
        qr_image.save(buffer, format='PNG')
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='image/png')
        response['Content-Disposition'] = f'inline; filename="event-{event.id}-attendance-qr.png"'
        return response

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def check_in(self, request, pk=None):
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admins can check in attendees.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        event = self.get_object()
        serializer = EventCheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attendance = EventAttendance.objects.filter(
            event=event,
            check_in_token=serializer.validated_data['check_in_token'],
        ).select_related('student').first()

        if not attendance:
            return Response(
                {'error': 'Invalid check-in token for this event.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if attendance.is_checked_in:
            return Response(
                {
                    'message': 'Student already checked in.',
                    'attendance': EventAttendanceSerializer(attendance).data,
                },
                status=status.HTTP_200_OK,
            )

        attendance.is_checked_in = True
        attendance.checked_in_at = timezone.now()
        attendance.checked_in_by = request.user
        attendance.save(update_fields=['is_checked_in', 'checked_in_at', 'checked_in_by', 'updated_at'])

        return Response(
            {
                'message': 'Check-in successful.',
                'attendance': EventAttendanceSerializer(attendance).data,
            },
            status=status.HTTP_200_OK,
        )
