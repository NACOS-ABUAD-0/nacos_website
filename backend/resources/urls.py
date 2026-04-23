# backend/resources/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ResourceViewSet, ResourceCategoryViewSet, ResourceTagViewSet, ResourceCountView, DriveResourcesView

router = DefaultRouter()
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'resource-categories', ResourceCategoryViewSet, basename='resource-category')
router.register(r'resource-tags', ResourceTagViewSet, basename='resource-tag')

urlpatterns = [
    # ← Custom paths FIRST — before the router swallows them
    path('resources/count/', ResourceCountView.as_view(), name='resource-count'),
    path('resources/drive/', DriveResourcesView.as_view(), name='drive-resources'),
    # ← Router last
    path('', include(router.urls)),
]