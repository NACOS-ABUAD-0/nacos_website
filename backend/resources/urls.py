# backend/resources/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ResourceViewSet, ResourceCategoryViewSet, ResourceTagViewSet

router = DefaultRouter()
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'resource-categories', ResourceCategoryViewSet, basename='resource-category')
router.register(r'resource-tags', ResourceTagViewSet, basename='resource-tag')

urlpatterns = [
    path('', include(router.urls)),
]