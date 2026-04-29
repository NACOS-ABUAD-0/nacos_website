from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # Auth
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    CSRFTokenView,
    VerifyEmailView,
    ResendVerificationEmailView,
    # General
    UserCountView,
    # Multistep Verification pipeline
    CheckEmailView,
    VerifyStudentIdentityView,
    # Password reset
    PasswordResetRequestView,
    PasswordResetConfirmView,
    # Admin
    AdminRoleAssignmentView,
    AdminListView,
    AdminUserListView,
    # Student Profile & Notifications
    StudentProfileView,
    NotificationListView,
    NotificationMarkReadView,
)

urlpatterns = [
    # Authentication
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", ProfileView.as_view(), name="profile"),
    path("auth/csrf/", CSRFTokenView.as_view(), name="csrf_token"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Multistep registration pipeline
    path("auth/check-email/", CheckEmailView.as_view(), name="check_email"),
    path("auth/verify-student/", VerifyStudentIdentityView.as_view(), name="verify_student"),

    # Email Verification
    path("auth/verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path(
        "auth/resend-verification/",
        ResendVerificationEmailView.as_view(),
        name="resend_verification",
    ),

    # Password reset
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),

    # Student Profile (Excel source of truth)
    path("student/profile/", StudentProfileView.as_view(), name="student-profile"),

    # Notifications
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/<int:pk>/read/", NotificationMarkReadView.as_view(), name="notification-read"),

    # General
    path("users/count/", UserCountView.as_view(), name="user-count"),

    # Admin — Role Management
    path("admin/roles/assign/", AdminRoleAssignmentView.as_view(), name="admin-role-assign"),
    path("admin/roles/revoke/", AdminRoleAssignmentView.as_view(), name="admin-role-revoke"),
    path("admin/roles/", AdminListView.as_view(), name="admin-list"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),

    # ── Face Authentication (NEW) ──────────────────────────────────────────────
    path("face-auth/", include("face_auth.urls")),
]