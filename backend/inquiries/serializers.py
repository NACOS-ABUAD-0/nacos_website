# backend/inquiries/serializers.py
from rest_framework import serializers
from .models import Inquiry


class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Inquiry
        fields = [
            'id', 'type', 'name', 'email', 'organization',
            'subject', 'message', 'budget_range', 'package_interest',
            'website_url', 'status', 'admin_notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'admin_notes', 'created_at', 'updated_at']


class InquiryAdminSerializer(serializers.ModelSerializer):
    """Full serializer for admin — can update status and admin_notes."""
    class Meta:
        model  = Inquiry
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']