# backend/accounts/views.py
import logging

from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.db import transaction
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils import timezone

from .models import User, StudentProfile, Notification
from .permissions import IsAdmin
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
)
from .utils import send_verification_email, verify_email_token
from .admin_whitelist import is_whitelisted_admin, MAX_ADMINS
from .student_service import verify_student_identity

logger = logging.getLogger(__name__)


# ─── Helpers ──────────────────────────────────────────────────────────────────

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


# ─── Auth Views ────────────────────────────────────────────────────────────────

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


# ─── Notifications ─────────────────────────────────────────────────────────────

class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifications = request.user.notifications.all()[:50]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = request.user.notifications.get(pk=pk)
        except Notification.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response({"status": "marked as read"})


# ─── Admin Views ───────────────────────────────────────────────────────────────

class AdminRoleAssignmentView(APIView):
    """
    POST   /admin/roles/assign/  — Promote a user to admin.
    DELETE /admin/roles/revoke/  — Revoke admin from a user.

    Both operations require the caller to be an authenticated admin.
    Promotion requires name + matric to be supplied and verified against
    the target user's stored record. Max 3 admins enforced at all times.
    """

    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    # ── Assign (POST) ──────────────────────────────────────────────────────
    def post(self, request):
        serializer = AdminRoleAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        matric_number: str = serializer.validated_data["matric_number"]
        full_name: str = serializer.validated_data["full_name"]

        with transaction.atomic():
            # ── Enforce max-admin ceiling ──────────────────────────────────
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

            # ── Idempotency ────────────────────────────────────────────────
            if target_user.role == User.Role.ADMIN:
                return Response(
                    {"message": f"{target_user.full_name} is already an admin."},
                    status=status.HTTP_200_OK,
                )

            # ── Promote ────────────────────────────────────────────────────
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
    Returns the list of current admins and the remaining slots.
    Only accessible by authenticated admins.
    """

    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        admins = User.objects.filter(role=User.Role.ADMIN)
        return Response(
            {
                "admins": UserSerializer(admins, many=True).data,
                "count": admins.count(),
                "max": MAX_ADMINS,
                "slots_remaining": MAX_ADMINS - admins.count(),
            }
        )


class AdminUserListView(APIView):
    """
    GET /admin/users/
    Returns all registered users. Only accessible by admins.
    """

    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")
        return Response(
            {
                "users": UserSerializer(users, many=True).data,
                "total": users.count(),
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