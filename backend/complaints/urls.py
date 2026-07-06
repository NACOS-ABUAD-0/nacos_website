# backend/complaints/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet, AdminComplaintViewSet

router = DefaultRouter()
router.register(r'complaints', ComplaintViewSet, basename='complaint')
router.register(r'admin/complaints', AdminComplaintViewSet, basename='admin-complaint')

urlpatterns = [
    path('', include(router.urls)),
]
