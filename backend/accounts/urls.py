from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

from .views import (
    # Auth
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    ChangePasswordView,
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
    AdminUserDeleteView,  # NEW
    AdminUserDetailView,
    AdminUserBanView,
    AdminUserUnbanView,
    # Student Profile & Notifications
    StudentProfileView,
    NotificationViewSet,
    RegisterDeviceView,
)

urlpatterns = [
    # Authentication
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", ProfileView.as_view(), name="profile"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
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

    # General
    path("users/count/", UserCountView.as_view(), name="user-count"),

    # Admin — Role Management
    path("admin/roles/assign/", AdminRoleAssignmentView.as_view(), name="admin-role-assign"),
    path("admin/roles/revoke/", AdminRoleAssignmentView.as_view(), name="admin-role-revoke"),
    path("admin/roles/", AdminListView.as_view(), name="admin-list"),

    # Admin — User Management (NEW)
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("admin/users/<int:pk>/delete/", AdminUserDeleteView.as_view(), name="admin-user-delete"),
    path("admin/users/<int:pk>/ban/", AdminUserBanView.as_view(), name="admin-user-ban"),
    path("admin/users/<int:pk>/unban/", AdminUserUnbanView.as_view(), name="admin-user-unban"),

    # ── Face Authentication ──────────────────────────────────────────────
    path("face-auth/", include("face_auth.urls")),

    # Push notifications (mobile)
    path("notifications/register-device/", RegisterDeviceView.as_view(), name="register-device"),
]

router = DefaultRouter()
router.register(r"notifications", NotificationViewSet, basename="notification")
urlpatterns += router.urls