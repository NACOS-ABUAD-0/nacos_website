# backend/resources/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ResourceViewSet, ResourceCategoryViewSet, ResourceTagViewSet,
    ResourceCountView, DriveResourcesView, ResourceSubmitView,
    AdminResourceViewSet, cloudinary_sign_resource,
)

router = DefaultRouter()
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'resource-categories', ResourceCategoryViewSet, basename='resource-category')
router.register(r'resource-tags', ResourceTagViewSet, basename='resource-tag')
router.register(r'admin/resources', AdminResourceViewSet, basename='admin-resource')

urlpatterns = [
    # ← Custom paths FIRST — before the router swallows them
    path('resources/count/', ResourceCountView.as_view(), name='resource-count'),
    path('resources/drive/', DriveResourcesView.as_view(), name='drive-resources'),
    path('resources/submit/', ResourceSubmitView.as_view(), name='resource-submit'),
    path('cloudinary/sign-resource/', cloudinary_sign_resource, name='cloudinary-sign-resource'),
    # ← Router last
    path('', include(router.urls)),
]
