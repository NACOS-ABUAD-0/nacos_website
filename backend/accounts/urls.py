# backend/accounts/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # ── Auth ──────────────────────────────────────────────────────────────
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    CSRFTokenView,
    VerifyEmailView,
    ResendVerificationEmailView,
    # ── General ───────────────────────────────────────────────────────────
    UserCountView,
    # ── Admin ─────────────────────────────────────────────────────────────
    AdminRoleAssignmentView,
    AdminListView,
    AdminUserListView,
)

urlpatterns = [
    # ── Authentication ─────────────────────────────────────────────────────
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", ProfileView.as_view(), name="profile"),
    path("auth/csrf/", CSRFTokenView.as_view(), name="csrf_token"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # ── Email Verification ─────────────────────────────────────────────────
    path("auth/verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path(
        "auth/resend-verification/",
        ResendVerificationEmailView.as_view(),
        name="resend_verification",
    ),

    # ── General ────────────────────────────────────────────────────────────
    path("users/count/", UserCountView.as_view(), name="user-count"),

    # ── Admin — Role Management ────────────────────────────────────────────
    # POST   → assign admin role (body: { matric_number, full_name })
    # DELETE → revoke admin role (body: { matric_number })
    path(
        "admin/roles/assign/",
        AdminRoleAssignmentView.as_view(),
        name="admin-role-assign",
    ),

    # Alias: DELETE to a separate URL for clarity (maps to same view)
    path(
        "admin/roles/revoke/",
        AdminRoleAssignmentView.as_view(),
        name="admin-role-revoke",
    ),

    # GET → list current admins + remaining slots
    path("admin/roles/", AdminListView.as_view(), name="admin-list"),

    # GET → list all users (admin only)
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
]