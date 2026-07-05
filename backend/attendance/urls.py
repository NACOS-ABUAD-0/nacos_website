# backend/attendance/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClassSessionViewSet, ScanAttendanceView

router = DefaultRouter()
router.register(r'attendance/class-sessions', ClassSessionViewSet, basename='class-session')

urlpatterns = [
    path('', include(router.urls)),
    path('attendance/scan/', ScanAttendanceView.as_view(), name='attendance-scan'),
]
