# backend/committees/views.py


from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

from .models import Committee, CommitteeApplication
from .serializers import (
    CommitteeSerializer,
    CommitteeApplicationSerializer,
    AdminCommitteeApplicationSerializer,
)
from accounts.models import Notification
from accounts.permissions import IsAdmin


class CommitteeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Committee.objects.all()
    serializer_class = CommitteeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CommitteeApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = CommitteeApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CommitteeApplication.objects.filter(
            user=self.request.user
        ).select_related('committee', 'user')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='my-applications')
    def my_applications(self, request):
        applications = self.get_queryset()
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)


class AdminCommitteeApplicationViewSet(viewsets.ModelViewSet):
    queryset = (
        CommitteeApplication.objects.all()
        .select_related('committee', 'user')
        .order_by('-created_at')
    )
    serializer_class = AdminCommitteeApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        application = self.get_object()
        with transaction.atomic():
            application.status = CommitteeApplication.Status.APPROVED
            application.admin_note = request.data.get('admin_note', '')
            application.save()

            Notification.objects.create(
                user=application.user,
                title="Committee Application Approved",
                message=f"Your application to join {application.committee.name} has been approved.",
                notification_type=Notification.Type.COMMITTEE,
                data={
                    'committee_id': application.committee.id,
                    'application_id': application.id,
                    'status': 'approved',
                }
            )
        return Response({
            'status': 'approved',
            'application': self.get_serializer(application).data
        })

    @action(detail=True, methods=['patch'], url_path='reject')
    def reject(self, request, pk=None):
        application = self.get_object()
        with transaction.atomic():
            application.status = CommitteeApplication.Status.REJECTED
            application.admin_note = request.data.get('admin_note', '')
            application.save()

            Notification.objects.create(
                user=application.user,
                title="Committee Application Rejected",
                message=f"Your application to join {application.committee.name} has been rejected.",
                notification_type=Notification.Type.COMMITTEE,
                data={
                    'committee_id': application.committee.id,
                    'application_id': application.id,
                    'status': 'rejected',
                }
            )
        return Response({
            'status': 'rejected',
            'application': self.get_serializer(application).data
        })