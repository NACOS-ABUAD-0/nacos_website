# backend/accounts/serializers.py

import re
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate

from .models import User
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

    class Meta:
        model = User
        fields = ("email", "full_name", "matric_number", "password", "password2")
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
            "role",          # ← new: exposes the RBAC role
        )
        read_only_fields = (
            "id",
            "email",
            "date_joined",
            "is_email_verified",
            "is_staff",
            "matric_number",  # ← immutable after registration
            "role",           # ← changed only via AdminRoleAssignmentView
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