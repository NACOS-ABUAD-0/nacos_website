# backend/inquiries/views.py
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

from .models import Inquiry
from .serializers import InquirySerializer, InquiryAdminSerializer


class InquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'status']
    search_fields    = ['name', 'email', 'organization', 'subject', 'message']
    ordering_fields  = ['created_at', 'status', 'type']
    ordering         = ['-created_at']

    def get_permissions(self):
        # Anyone can submit; only admins can read/update/delete
        if self.action == 'create':
            return [AllowAny()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.request.user and self.request.user.is_staff:
            return InquiryAdminSerializer
        return InquirySerializer

    @action(detail=True, methods=['patch'], permission_classes=[AllowAny])
    def update_status(self, request, pk=None):
        inquiry = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Inquiry.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        inquiry.status = new_status
        if 'admin_notes' in request.data:
            inquiry.admin_notes = request.data['admin_notes']
        inquiry.save()
        return Response(InquiryAdminSerializer(inquiry).data)