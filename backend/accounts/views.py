# backend/accounts/views.py

import logging

from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.db import transaction

from .models import User
from .permissions import IsAdmin
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    UserSerializer,
    AdminRoleAssignSerializer,
    AdminRoleRevokeSerializer,
)
from .utils import send_verification_email, verify_email_token
from .admin_whitelist import is_whitelisted_admin, MAX_ADMINS

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