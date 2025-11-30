# backend/projects/permissions.py
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner or admin
        return obj.owner == request.user or request.user.is_staff


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission to only allow admins to edit, but anyone to read.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to admins
        return request.user and request.user.is_staff
