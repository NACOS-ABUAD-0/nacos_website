# path: backend/projects/permissions.py
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    View-level:   any authenticated user may read; only owners/staff may write.
    Object-level: only the object owner (or staff) may mutate.

    Both levels are enforced so there is no gap if get_object() is bypassed.
    """

    def has_permission(self, request, view):
        # Safe methods (GET, HEAD, OPTIONS) are always allowed through.
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write methods require authentication at minimum.
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are always granted.
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions belong to the owner or staff only.
        return obj.owner == request.user or request.user.is_staff


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission to only allow admins to write, but anyone to read.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff