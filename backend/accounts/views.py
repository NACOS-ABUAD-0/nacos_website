# backend/accounts/views.py

import logging
from django.db.models import Q
from rest_framework import status, permissions, generics, viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.db import transaction
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils import timezone
from django.core.paginator import Paginator
from django.db import transaction
from django.shortcuts import get_object_or_404

from . import models
from .models import User, StudentProfile, Notification
from .permissions import IsAdmin, IsSuperAdmin
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    UserSerializer,
    StudentProfileSerializer,
    NotificationSerializer,
    AdminRoleAssignSerializer,
    AdminRoleRevokeSerializer,
    CheckEmailSerializer,
    VerifyStudentSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    AdminUserSerializer,
    AdminUserDeleteSerializer,
    ChangePasswordSerializer,
)
from .utils import send_verification_email, verify_email_token
from .admin_whitelist import is_whitelisted_admin, MAX_ADMINS
from .student_service import verify_student_identity

logger = logging.getLogger(__name__)


# Helpers

def _sync_admin_status(user: User) -> bool:
    """
    Re-checks the sealed whitelist on every login and syncs the user's
    role if they are whitelisted but somehow lost admin status.

    Returns True if the role was updated, False otherwise.
    """
    if not user.matric_number:
        return False

    should_be_admin = is_whitelisted_admin(user.full_name, user.matric_number)

    if should_be_admin and not user.is_admin:
        current_count = User.objects.filter(role=User.Role.ADMIN).count()
        if current_count < MAX_ADMINS:
            user.role = User.Role.ADMIN
            user.save(update_fields=["role", "is_staff"])
            logger.info(
                "Admin status auto-restored for whitelisted user: %s", user.email
            )
            return True

    return False


# Auth Views

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Attempt to send verification email (non-fatal)
            email_sent = False
            try:
                email_sent = send_verification_email(user, request)
            except Exception:
                logger.warning(
                    "Failed to send verification email to %s", user.email,
                    exc_info=True
                )

            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": ProfileSerializer(user).data,
                    "message": (
                        "Registration successful! Please check your email to verify your account."
                        if email_sent
                        else "Registration successful! (Email verification is not configured on this server.)"
                    ),
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user: User = serializer.validated_data["user"]

            # ── Sync admin status on every login (whitelist drift guard) ──
            _sync_admin_status(user)

            login(request, user)
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": ProfileSerializer(user).data,
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            logout(request)
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as exc:
            logger.warning("Logout failed: %s", exc)
            return Response(status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Lets an authenticated user (any role) change their own password by
    supplying their current password. Not admin-specific.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data["new_password"])
            user.save(update_fields=["password"])
            logger.info("Password changed for user: %s", user.email)
            return Response(
                {"detail": "Password changed successfully."}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CSRFTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")

        if not uidb64 or not token:
            return Response(
                {"error": "UID and token are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = verify_email_token(uidb64, token)
        if user:
            return Response(
                {
                    "message": "Email verified successfully!",
                    "user": ProfileSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "Invalid or expired verification link."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class ResendVerificationEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_email_verified:
            return Response(
                {"message": "Email is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success = send_verification_email(user, request)
        if success:
            return Response(
                {"message": "Verification email sent successfully! Please check your inbox."},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "Failed to send verification email. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class UserCountView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"count": User.objects.count()})

# Student Profile
class StudentProfileView(APIView):
    """
    GET  → Returns the student's cached profile.
            If missing or stale, syncs from the Excel roster via matric number.
    PATCH→ Allows updating phone_number only.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, created = StudentProfile.objects.get_or_create(user=user)

        if created or not profile.last_synced_at:
            if user.matric_number:
                record = verify_student_identity(user.full_name, user.matric_number)
                if record:
                    profile.department = record.department
                    profile.level = record.level
                    profile.excel_full_name = record.full_name
                    profile.excel_matric_number = record.matric_number
                    profile.last_synced_at = timezone.now()
                    profile.save()

        serializer = StudentProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile = request.user.student_profile
        serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Notifications




class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user notifications.
    - list: GET /api/notifications/
    - retrieve: GET /api/notifications/{id}/
    - destroy: DELETE /api/notifications/{id}/
    - read: PATCH /api/notifications/{id}/read/
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notifications.all()

    @action(detail=True, methods=['patch'], url_path='read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response({"status": "marked as read"})

    def destroy(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Admin Views

class AdminRoleAssignmentView(APIView):
    """
    POST   /admin/roles/assign/  — Promote a user to admin.
    DELETE /admin/roles/revoke/  — Revoke admin from a user.

    Both operations require the caller to be the super admin — regular
    admins cannot promote or revoke other admins themselves.
    Promotion requires name + matric to be supplied and verified against
    the target user's stored record. Max 3 admins enforced at all times.
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    # Assign (POST)
    def post(self, request):
        serializer = AdminRoleAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        matric_number: str = serializer.validated_data["matric_number"]
        full_name: str = serializer.validated_data["full_name"]

        with transaction.atomic():
            # Enforce max-admin ceiling
            # select_for_update() locks the rows so concurrent promotions
            # can't race past the limit.
            current_admin_count = (
                User.objects
                .filter(role=User.Role.ADMIN)
                .select_for_update()
                .count()
            )
            if current_admin_count >= MAX_ADMINS:
                return Response(
                    {
                        "error": (
                            f"Maximum admin limit ({MAX_ADMINS}) reached. "
                            "Revoke an existing admin before promoting a new one."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ── Look up the target user ────────────────────────────────────
            try:
                target_user = User.objects.select_for_update().get(
                    matric_number=matric_number
                )
            except User.DoesNotExist:
                return Response(
                    {"error": "No user found with the provided matric number."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # ── Verify name matches stored record ──────────────────────────
            # This prevents an attacker who knows someone's matric from
            # impersonating them by guessing an existing account.
            from .admin_whitelist import normalize_name
            if normalize_name(target_user.full_name) != normalize_name(full_name):
                return Response(
                    {"error": "The provided name does not match our records for this matric number."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Idempotency
            if target_user.role == User.Role.ADMIN:
                return Response(
                    {"message": f"{target_user.full_name} is already an admin."},
                    status=status.HTTP_200_OK,
                )

            #Promote
            target_user.role = User.Role.ADMIN
            target_user.save(update_fields=["role", "is_staff"])

        logger.info(
            "Admin '%s' promoted user '%s' (matric: %s) to admin.",
            request.user.email, target_user.email, matric_number,
        )

        return Response(
            {
                "message": f"{target_user.full_name} has been promoted to admin.",
                "user": UserSerializer(target_user).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Revoke (DELETE) ────────────────────────────────────────────────────
    def delete(self, request):
        serializer = AdminRoleRevokeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        matric_number: str = serializer.validated_data["matric_number"]

        # ── Prevent self-demotion ──────────────────────────────────────────
        if request.user.matric_number == matric_number:
            return Response(
                {"error": "You cannot revoke your own admin privileges."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_user = User.objects.get(matric_number=matric_number)
        except User.DoesNotExist:
            return Response(
                {"error": "No user found with the provided matric number."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if target_user.role != User.Role.ADMIN:
            return Response(
                {"error": "This user is not currently an admin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user.role = User.Role.USER
        target_user.save(update_fields=["role", "is_staff"])

        logger.info(
            "Admin '%s' revoked admin role from '%s' (matric: %s).",
            request.user.email, target_user.email, matric_number,
        )

        return Response(
            {"message": f"Admin privileges successfully revoked from {target_user.full_name}."},
            status=status.HTTP_200_OK,
        )


class AdminListView(APIView):
    """
    GET /admin/roles/
    Returns the list of current admins (and the super admin) and the
    remaining regular-admin slots. Only accessible by the super admin.
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        # MAX_ADMINS caps only the regular ADMIN tier — the super admin is a
        # separate, singular, manually-assigned role outside that ceiling.
        admins = User.objects.filter(role=User.Role.ADMIN)
        all_privileged = User.objects.filter(
            role__in=[User.Role.ADMIN, User.Role.SUPER_ADMIN]
        )
        return Response(
            {
                "admins": UserSerializer(all_privileged, many=True).data,
                "count": admins.count(),
                "max": MAX_ADMINS,
                "slots_remaining": MAX_ADMINS - admins.count(),
            }
        )



class CheckEmailView(APIView):
    """
    POST /auth/check-email/
    Validates email format and confirms it is not already registered.
    Gate 1 of the registration pipeline.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = CheckEmailSerializer(data=request.data)
        if serializer.is_valid():
            return Response(
                {"detail": "Email is valid and available."},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyStudentIdentityView(APIView):
    """
    POST /auth/verify-student/
    Matches (email, full_name, matric_number) against the Excel roster.
    On success returns a signed verification_token consumed by /auth/register/.
    Gate 2 of the registration pipeline.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = VerifyStudentSerializer(data=request.data)
        if serializer.is_valid():
            record   = serializer.validated_data["_record"]
            token    = serializer.generate_token()

            return Response(
                {
                    "detail": "Identity verified successfully.",
                    "verification_token": token,
                    # Return verified details so the frontend can confirm to the user
                    "student": {
                        "full_name":   record.full_name,
                        "department":  record.department,
                        "level":       record.level,
                    },
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    """
    POST /auth/password-reset/
    Sends a password-reset email to the user if the supplied credentials match.
    Always returns 200 to prevent email enumeration.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            # Even on validation error, check if it's the "not found" sentinel
            # (already returns a vague message) — otherwise return errors.
            errors = serializer.errors
            non_field = errors.get("non_field_errors", [])
            if non_field and "reset link will be sent" in str(non_field):
                # Email not found — return 200 to prevent enumeration
                return Response(
                    {"detail": "If this email is registered, a password-reset link has been sent."},
                    status=status.HTTP_200_OK,
                )
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user: User = serializer.validated_data["_user"]
        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Re-use the existing email infrastructure
        from .utils import _send_email   # internal helper — see note in utils.py
        reset_url = f"{request.scheme}://{request.get_host()}/reset-password?uid={uid}&token={token}"

        try:
            _send_password_reset_email(user, reset_url)
        except Exception:
            logger.warning(
                "Failed to send password-reset email to %s", user.email, exc_info=True
            )
            # Still return 200 — don't reveal server config issues

        return Response(
            {"detail": "If this email is registered, a password-reset link has been sent."},
            status=status.HTTP_200_OK,
        )


def _send_password_reset_email(user: User, reset_url: str) -> None:
    """Send a password-reset email using Django's built-in email system."""
    from django.core.mail import send_mail
    from django.conf import settings

    print("=" * 50)
    print("EMAIL_HOST:", repr(getattr(settings, "EMAIL_HOST", "MISSING")))
    print("EMAIL_PORT:", repr(getattr(settings, "EMAIL_PORT", "MISSING")))
    print("EMAIL_USE_TLS:", repr(getattr(settings, "EMAIL_USE_TLS", "MISSING")))
    print("EMAIL_HOST_USER:", repr(getattr(settings, "EMAIL_HOST_USER", "MISSING")))
    print("EMAIL_BACKEND:", repr(getattr(settings, "EMAIL_BACKEND", "MISSING")))
    print("=" * 50)

    subject = "Reset your NACOS ABUAD password"
    body = (
        f"Hi {user.full_name},\n\n"
        "You requested a password reset. Click the link below to set a new password.\n"
        "This link expires in 1 hour.\n\n"
        f"{reset_url}\n\n"
        "If you did not request this, please ignore this email.\n\n"
        "— NACOS ABUAD"
    )
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
class PasswordResetConfirmView(APIView):
    """
    POST /auth/password-reset/confirm/
    Validates the uid + token pair and sets a new password.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user: User = serializer.validated_data["_user"]
            user.set_password(serializer.validated_data["password"])
            user.save(update_fields=["password"])
            logger.info("Password successfully reset for user: %s", user.email)
            return Response(
                {"detail": "Password has been reset successfully. You can now log in."},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Admin User Management Views ─────────────────────────────────────────────

class AdminUserListView(APIView):
    """
    GET /api/admin/users/

    Returns a paginated list of all registered users.
    Supports query parameters:
      - page: Page number (default: 1)
      - page_size: Items per page (default: 10, max: 100)
      - search: Filter by matric_number or full_name (case-insensitive)
      - level: Filter by student level
      - role: Filter by user role ('user' or 'admin')

    Only accessible by authenticated admins.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        # Base queryset with select_related to prevent N+1 queries
        queryset = User.objects.select_related("student_profile").all().order_by("-date_joined")

        # ── Filtering ──────────────────────────────────────────────────────
        search_query = request.query_params.get("search", "").strip()
        if search_query:
            queryset = queryset.filter(
                Q(full_name__icontains=search_query) |
                Q(matric_number__icontains=search_query) |
                Q(email__icontains=search_query)
            )

        level_filter = request.query_params.get("level", "").strip()
        if level_filter:
            queryset = queryset.filter(student_profile__level__iexact=level_filter)

        role_filter = request.query_params.get("role", "").strip().lower()
        if role_filter in ["user", "admin", "super_admin"]:
            queryset = queryset.filter(role=role_filter)

        is_active_filter = request.query_params.get("is_active", "").strip().lower()
        if is_active_filter in ["true", "false"]:
            queryset = queryset.filter(is_active=(is_active_filter == "true"))

        # ── Pagination ─────────────────────────────────────────────────────
        page_size = min(int(request.query_params.get("page_size", 10)), 100)
        page_number = max(int(request.query_params.get("page", 1)), 1)

        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page_number)

        serializer = AdminUserSerializer(page_obj.object_list, many=True)

        return Response({
            "results": serializer.data,
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_number,
            "page_size": page_size,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        })

class AdminUserDeleteView(APIView):
    """
    DELETE /api/admin/users/<id>/delete/

    Secure user deletion endpoint.

    Request Body:
        {
            "matric_number": "23/SCI01/002",
            "full_name": "John Doe"
        }

    Security measures:
        - Only admins can access
        - Must provide exact matric_number and full_name matching the target
        - Cannot delete yourself
        - Cannot delete other admins (safety measure)
        - Atomic transaction ensures data consistency
        - Returns 204 No Content on success
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def delete(self, request, pk=None):
        # ── Validate input ─────────────────────────────────────────────────
        serializer = AdminUserDeleteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        validated_matric = serializer.validated_data["matric_number"]
        validated_name = serializer.validated_data["full_name"]

        # ── Fetch target user ──────────────────────────────────────────────
        try:
            target_user = User.objects.select_related("student_profile").get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # ── Self-deletion guard ────────────────────────────────────────────
        if target_user.id == request.user.id:
            return Response(
                {"error": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Admin deletion guard ───────────────────────────────────────────
        if target_user.is_admin:
            return Response(
                {"error": "Cannot delete another admin account. Revoke admin privileges first."},
                status=status.HTTP_403_FORBIDDEN
            )

        # ── Strict credential verification ─────────────────────────────────
        # Normalize stored values for exact comparison
        stored_matric = (target_user.matric_number or "").strip().upper()
        stored_name = " ".join(target_user.full_name.strip().split())

        if stored_matric != validated_matric:
            return Response(
                {"error": "The provided matric number does not match our records for this user."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if stored_name != validated_name:
            return Response(
                {"error": "The provided full name does not match our records for this user."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Atomic deletion ────────────────────────────────────────────────
        user_email = target_user.email
        user_name = target_user.full_name
        try:
            with transaction.atomic():
                # Delete related profiles first (if cascade isn't set)
                StudentProfile.objects.filter(user=target_user).delete()
                # Delete notifications
                Notification.objects.filter(user=target_user).delete()
                # Finally delete the user
                target_user.delete()
        except Exception as exc:
            logger.error("Failed to delete user %s: %s", user_email, exc, exc_info=True)
            return Response(
                {"error": "An error occurred while deleting the user. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        logger.info(
            "Admin '%s' successfully deleted user '%s' (matric: %s).",
            request.user.email, user_email, validated_matric
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserDetailView(APIView):
    """
    GET /api/admin/users/<id>/
    Fetches a single user by id for the admin dashboard's detail view.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, pk=None):
        try:
            user = User.objects.select_related("student_profile").get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminUserSerializer(user).data)


class AdminUserBanView(APIView):
    """
    PATCH /api/admin/users/<id>/ban/
    Deactivates a user's account (is_active=False), which already blocks
    login via LoginSerializer. Cannot ban yourself or another admin.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, pk=None):
        try:
            target_user = User.objects.select_related("student_profile").get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if target_user.id == request.user.id:
            return Response(
                {"error": "You cannot ban your own account."}, status=status.HTTP_400_BAD_REQUEST
            )

        if target_user.is_admin:
            return Response(
                {"error": "Cannot ban another admin account. Revoke admin privileges first."},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            target_user.is_active = False
            target_user.save(update_fields=["is_active"])

        logger.info("Admin '%s' banned user '%s'.", request.user.email, target_user.email)
        return Response(AdminUserSerializer(target_user).data)


class AdminUserUnbanView(APIView):
    """
    PATCH /api/admin/users/<id>/unban/
    Reactivates a previously banned account.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, pk=None):
        try:
            target_user = User.objects.select_related("student_profile").get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            target_user.is_active = True
            target_user.save(update_fields=["is_active"])

        logger.info("Admin '%s' unbanned user '%s'.", request.user.email, target_user.email)
        return Response(AdminUserSerializer(target_user).data)
