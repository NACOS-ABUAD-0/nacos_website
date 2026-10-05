# backend/events/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminEventRegistrationViewSet, EventViewSet, PaystackVerifyView, PaystackWebhookView

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='events')
router.register(r'admin/event-registrations', AdminEventRegistrationViewSet, basename='admin-event-registration')

urlpatterns = [
    path('', include(router.urls)),
    path('payments/paystack/verify/<str:reference>/', PaystackVerifyView.as_view(), name='paystack-verify'),
    path('payments/paystack/webhook/', PaystackWebhookView.as_view(), name='paystack-webhook'),
]
