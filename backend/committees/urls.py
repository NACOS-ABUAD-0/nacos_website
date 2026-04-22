# backend/committees/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CommitteeViewSet,
    CommitteeApplicationViewSet,
    AdminCommitteeApplicationViewSet,
)

router = DefaultRouter()
router.register(r'committees', CommitteeViewSet, basename='committee')
router.register(r'committee-applications', CommitteeApplicationViewSet, basename='committee-application')
router.register(r'admin/committee-applications', AdminCommitteeApplicationViewSet, basename='admin-committee-application')

urlpatterns = [
    path('', include(router.urls)),
]