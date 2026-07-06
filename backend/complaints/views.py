# backend/complaints/views.py

from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from accounts.permissions import IsAdmin
from .models import Complaint
from .serializers import AdminComplaintSerializer, ComplaintSerializer


class ComplaintViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    POST /api/complaints/            — submit a complaint (anonymous or not)
    GET  /api/complaints/             — your own complaints
    GET  /api/complaints/my-complaints/  — same as above (explicit alias,
                                           matching the committees convention)

    Anonymous complaints have no `user` stored at all, so they will never
    appear here even to the person who submitted them — that's the actual
    anonymity guarantee, not just a display choice.
    """
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'complaint'

    def get_queryset(self):
        return Complaint.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        is_anonymous = serializer.validated_data.get('is_anonymous', False)
        serializer.save(user=None if is_anonymous else self.request.user)

    @action(detail=False, methods=['get'], url_path='my-complaints')
    def my_complaints(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)


class AdminComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all().select_related('user').order_by('-created_at')
    serializer_class = AdminComplaintSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        complaint = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Complaint.Status.choices):
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
        complaint.status = new_status
        if 'admin_note' in request.data:
            complaint.admin_note = request.data['admin_note']
        complaint.save()
        return Response(AdminComplaintSerializer(complaint).data)
