# backend/events/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminEventRegistrationViewSet, EventViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='events')
router.register(r'admin/event-registrations', AdminEventRegistrationViewSet, basename='admin-event-registration')

urlpatterns = [
    path('', include(router.urls)),
]
