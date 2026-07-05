# backend/accounts/permissions.py

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Grants access only to users with the 'admin' role or is_staff=True.

    This is the canonical permission class for all admin-only endpoints.
    It deliberately checks BOTH role and is_staff to remain resilient
    against any state drift between the two fields.

    Usage:
        permission_classes = [permissions.IsAuthenticated, IsAdmin]
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_admin  # uses the model's is_admin property
        )


class IsSuperAdmin(BasePermission):
    """
    Grants access only to the super admin (a single, manually-assigned role
    tier above regular admins). Used to gate promoting/revoking other admins
    so a regular admin can't grant or strip admin access themselves.

    Usage:
        permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    """

    message = "Only a super admin can perform this action."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_super_admin
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Allows read access to any authenticated user,
    but restricts write operations to admins only.
    """

    message = "Write access is restricted to administrators."

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        # Safe HTTP methods are read-only
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        return request.user.is_admin