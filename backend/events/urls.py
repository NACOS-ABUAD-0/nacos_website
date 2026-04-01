<<<<<<< HEAD
# backend/events/urls.py

=======
>>>>>>> 4651335 (Ready for deployment)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='events')

urlpatterns = [
    path('', include(router.urls)),
]
