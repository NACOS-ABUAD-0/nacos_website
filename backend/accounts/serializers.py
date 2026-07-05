# backend/accounts/serializers.py

import re
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.core import signing
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str

from .models import User, StudentProfile, Notification
from .admin_whitelist import normalize_matric, MAX_ADMINS

# ─── Shared Constants ──────────────────────────────────────────────────────────

# Validates a NORMALIZED (uppercase) matric number.
# Accepted formats:
#   23/SCI01/002      → standard university matric
#   202330217286FA    → JAMB registration number
_MATRIC_PATTERN = re.compile(
    r'^(\d{2}/[A-Z]{3}\d{2}/\d{3}|\d{12}[A-Z]{2})$'
)


def _validate_and_normalize_matric(value: str) -> str:
    """
    Shared helper: normalize → validate → return normalized value.

    Raises serializers.ValidationError on invalid format.
    """
    normalized = normalize_matric(value)  # strip + uppercase
    if not _MATRIC_PATTERN.match(normalized):
        raise serializers.ValidationError(
            "Must be in format '23/SCI01/002' "
            "or JAMB Reg Number e.g. '202330217286FA'."
        )
    return normalized


# ─── RegisterSerializer ────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password2 = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
        label="Confirm password",
    )
    verification_token = serializers.CharField(
        write_only=True,
        required=False,      # enforced conditionally in validate()
        allow_blank=True,
        help_text="Signed token from the student-identity verification step.",
    )

    class Meta:
        model = User
        fields = ("email", "full_name", "matric_number",
                  "password", "password2", "verification_token")
        extra_kwargs = {
            # matric_number is REQUIRED for all API sign-ups.
            # null/blank is only allowed at model level for management commands.
            "matric_number": {"required": True, "allow_blank": False, "allow_null": False},
        }

    # ── Field-level validations ────────────────────────────────────────────

    def validate_email(self, value: str) -> str:
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        return normalized

    def validate_matric_number(self, value: str) -> str:
        """
        1. Normalize (strip + uppercase).
        2. Validate format.
        3. Enforce uniqueness (case-insensitive via normalization).
        """
        normalized = _validate_and_normalize_matric(value)

        if User.objects.filter(matric_number=normalized).exists():
            raise serializers.ValidationError(
                "A user with this matric number already exists."
            )

        return normalized  # serializer.validated_data will contain the normalized form

    def validate_full_name(self, value: str) -> str:
        # Collapse internal whitespace and strip edges
        return " ".join(value.strip().split())

    # ── Object-level validation ────────────────────────────────────────────

    def validate(self, attrs: dict) -> dict:
        from django.conf import settings
        from django.core import signing
        from .admin_whitelist import normalize_matric

        if getattr(settings, "REQUIRE_STUDENT_VERIFICATION", True):
            token = attrs.pop("verification_token", None)
            if not token:
                raise serializers.ValidationError(
                    {"verification_token": "Identity verification is required before registration."}
                )
            try:
                payload = signing.loads(
                    token, salt="student-verification", max_age=900
                )
            except signing.SignatureExpired:
                raise serializers.ValidationError(
                    {"verification_token": "Verification session has expired. Please restart."}
                )
            except signing.BadSignature:
                raise serializers.ValidationError(
                    {"verification_token": "Invalid verification token. Please restart."}
                )

            # Bind token to the exact email + matric submitted
            if payload.get("email") != attrs["email"]:
                raise serializers.ValidationError(
                    {"verification_token": "Token does not match the submitted email."}
                )
            if payload.get("matric") != normalize_matric(attrs.get("matric_number", "")):
                raise serializers.ValidationError(
                    {"verification_token": "Token does not match the submitted matric number."}
                )
        else:
            attrs.pop("verification_token", None)   # dev mode: ignore token

        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    # ── Create ─────────────────────────────────────────────────────────────

    def create(self, validated_data: dict) -> User:
        from .admin_whitelist import is_whitelisted_admin

        validated_data.pop("password2")
        password = validated_data.pop("password")

        # Create the user (matric_number is already normalized by validate_matric_number)
        user: User = User.objects.create_user(password=password, **validated_data)

        # ── Auto-promote whitelisted admins ────────────────────────────────
        # If this user's name + matric match the sealed whitelist,
        # grant admin immediately without any manual intervention.
        if is_whitelisted_admin(user.full_name, user.matric_number):
            current_admin_count = User.objects.filter(role=User.Role.ADMIN).count()
            if current_admin_count < MAX_ADMINS:
                user.role = User.Role.ADMIN
                # is_staff is synced automatically in User.save()
                user.save(update_fields=["role", "is_staff"])

        return user


# ─── LoginSerializer ───────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={"input_type": "password"})

    def validate(self, attrs: dict) -> dict:
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError(
                'Both "email" and "password" are required.'
            )

        user = authenticate(email=email, password=password)

        if not user:
            raise serializers.ValidationError(
                "Unable to log in with the provided credentials."
            )
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        attrs["user"] = user
        return attrs


# ─── ProfileSerializer ─────────────────────────────────────────────────────────

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "matric_number",
            "date_joined",
            "is_email_verified",
            "is_staff",
            "role",
            "face_login_enabled",
        )
        read_only_fields = (
            "id",
            "email",
            "date_joined",
            "is_email_verified",
            "is_staff",
            "matric_number",
            "role",
            "face_login_enabled",
        )


# ─── UserSerializer ────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    """Lightweight read-only user representation used in admin responses."""

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "matric_number", "is_staff", "role")
        read_only_fields = fields


# ─── AdminRoleAssignmentSerializer ────────────────────────────────────────────

class AdminRoleAssignSerializer(serializers.Serializer):
    """
    Validates input for promoting a user to admin.
    Both full_name AND matric_number are required and verified
    against the target user's stored data.
    """

    matric_number = serializers.CharField(max_length=20)
    full_name = serializers.CharField(max_length=255)

    def validate_matric_number(self, value: str) -> str:
        return _validate_and_normalize_matric(value)

    def validate_full_name(self, value: str) -> str:
        return " ".join(value.strip().split())


class AdminRoleRevokeSerializer(serializers.Serializer):
    """
    Validates input for revoking admin from a user.
    Only matric_number is required for revocation.
    """

    matric_number = serializers.CharField(max_length=20)

    def validate_matric_number(self, value: str) -> str:
        return _validate_and_normalize_matric(value)


class CheckEmailSerializer(serializers.Serializer):
    """Step 1 — validate email format and confirm it is not already registered."""
    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError(
                "An account with this email already exists. Please log in instead."
            )
        return normalized


class VerifyStudentSerializer(serializers.Serializer):
    """
    Step 2 — check that (email, full_name, matric_number) matches the Excel roster.
    On success, issues a short-lived signed token the registration endpoint requires.
    """
    email        = serializers.EmailField()
    full_name    = serializers.CharField(max_length=255)
    matric_number = serializers.CharField(max_length=20)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_full_name(self, value: str) -> str:
        return " ".join(value.strip().split())

    def validate_matric_number(self, value: str) -> str:
        return _validate_and_normalize_matric(value)

    def validate(self, attrs: dict) -> dict:
        from .student_service import verify_student_identity

        record = verify_student_identity(attrs["full_name"], attrs["matric_number"])
        if record is None:
            raise serializers.ValidationError(
                "We could not find a student matching the provided name "
                "and matric number. Please check your details."
            )
        attrs["_record"] = record
        return attrs

    def generate_token(self) -> str:
        """
        Call after .is_valid(raise_exception=True).
        Returns a TimestampSigner token valid for 15 minutes.
        """
        data = self.validated_data
        return signing.dumps(
            {"email": data["email"], "matric": data["matric_number"]},
            salt="student-verification",
            compress=True,
        )


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Forgot-password step 1.
    Requires email. Optionally matric_number for extra identity assurance.
    """
    email         = serializers.EmailField()
    matric_number = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_matric_number(self, value: str) -> str:
        if not value:
            return value
        return _validate_and_normalize_matric(value)

    def validate(self, attrs: dict) -> dict:
        email  = attrs["email"]
        matric = attrs.get("matric_number", "")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Deliberately vague — prevents email enumeration
            raise serializers.ValidationError(
                "If this email is registered, a reset link will be sent."
            )

        if matric:
            from .admin_whitelist import normalize_matric
            if user.matric_number and normalize_matric(matric) != user.matric_number:
                raise serializers.ValidationError(
                    "The matric number does not match our records for this email."
                )

        attrs["_user"] = user
        return attrs


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Forgot-password step 2 — supply uid, token, and new passwords."""
    uid      = serializers.CharField()
    token    = serializers.CharField()
    password  = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password2 = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        try:
            uid  = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"uid": "Invalid reset link."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError(
                {"token": "Reset link is invalid or has expired. Please request a new one."}
            )

        attrs["_user"] = user
        return attrs

class StudentProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    matric_number = serializers.CharField(source="user.matric_number", read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "id", "full_name", "email", "matric_number",
            "department", "level", "phone_number",
            "last_synced_at", "created_at",
        ]
        read_only_fields = [
            "id", "full_name", "email", "matric_number",
            "department", "level", "last_synced_at", "created_at",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "title", "message", "notification_type",
            "is_read", "data", "created_at",
        ]
        read_only_fields = [
            "id", "title", "message", "notification_type",
            "data", "created_at",
        ]

# Admin User Management Serializers

class AdminUserSerializer(serializers.ModelSerializer):
    """
    Full read-only representation of a user for admin dashboards.
    Includes all fields needed for user management.
    """
    level = serializers.CharField(source="student_profile.level", read_only=True, default="")
    department = serializers.CharField(source="student_profile.department", read_only=True, default="")
    date_joined = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "matric_number",
            "level",
            "department",
            "role",
            "is_staff",
            "is_active",
            "is_email_verified",
            "date_joined",
            "face_login_enabled",
        )
        read_only_fields = fields


class ChangePasswordSerializer(serializers.Serializer):
    """Validates a current+new password pair for an authenticated user."""

    current_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(
        write_only=True, validators=[validate_password], style={"input_type": "password"},
    )
    new_password2 = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate_current_password(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password": "Passwords do not match."})
        return attrs


class AdminUserDeleteSerializer(serializers.Serializer):
    """
    Validates deletion credentials for secure user removal.
    Both matric_number and full_name must exactly match the target user.
    """
    matric_number = serializers.CharField(
        max_length=20,
        required=True,
        help_text="Exact matric number of the user to delete."
    )
    full_name = serializers.CharField(
        max_length=255,
        required=True,
        help_text="Exact full name of the user to delete."
    )

    def validate_matric_number(self, value: str) -> str:
        """Normalize matric number to uppercase for exact matching."""
        return str(value).strip().upper()

    def validate_full_name(self, value: str) -> str:
        """Normalize full name by collapsing whitespace for exact matching."""
        return " ".join(value.strip().split())