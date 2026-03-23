# backend/projects/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, SkillTagViewSet


router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'skilltags', SkillTagViewSet, basename='skilltag')

urlpatterns = [
    path('', include(router.urls)),
]