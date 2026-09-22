# backend/accounts/serializers.py

import re
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core import signing
from django.db import transaction
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str

from .models import User, StudentProfile, Notification, DeviceToken
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


def _validate_matric_case(value: str) -> str:
    """
    Registration-time variant of _validate_and_normalize_matric: the format must
    be valid AND typed in capital letters. A well-formed but wrongly-cased entry
    (e.g. '23/sci01/002') is rejected with a message that shows the fix, rather
    than being silently changed, so the student knows what the correct form is.
    """
    normalized = _validate_and_normalize_matric(value)
    entered = value.strip()
    if entered != normalized:
        raise serializers.ValidationError(
            f"Matric number must be typed in capital letters. "
            f"Use '{normalized}' instead of '{entered}'."
        )
    return normalized


# ─── Name and level (entered by the student at signup) ─────────────────────────

# The student states their own level. The roster spreadsheet's level column is
# last session's, so it's no longer trusted or copied into profiles.
LEVEL_CHOICES = ("100", "200", "300", "400")


def _collapse_spaces(value: str) -> str:
    return " ".join(value.split())


def compose_full_name(surname: str, other_names: str) -> str:
    """Surname first, then other names: 'Bada' + 'Najeebah Motunrayo'."""
    return f"{_collapse_spaces(surname)} {_collapse_spaces(other_names)}"


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
        required=False,      # enforced conditionally in validate() — students only
        allow_blank=True,
        help_text="Signed token from the student-identity verification step.",
    )
    # The name arrives in two parts; validate() composes them into User.full_name.
    surname = serializers.CharField(
        write_only=True,
        max_length=100,
        error_messages={
            "required": "Surname is required.",
            "blank": "Surname is required.",
        },
    )
    other_names = serializers.CharField(
        write_only=True,
        max_length=150,
        error_messages={
            "required": "Other names are required.",
            "blank": "Other names are required.",
        },
    )
    # Required for students only; enforced conditionally in validate(). Not
    # allow_blank: an explicitly-submitted blank/invalid value should still
    # surface the choice-list message below, not the generic "required" one.
    level = serializers.ChoiceField(
        choices=LEVEL_CHOICES,
        write_only=True,
        required=False,
        error_messages={
            "invalid_choice": "Select your level: 100, 200, 300 or 400.",
        },
    )
    account_type = serializers.ChoiceField(
        choices=User.AccountType.choices,
        default=User.AccountType.STUDENT,
        error_messages={
            "invalid_choice": "Select either Student or Staff.",
        },
    )

    class Meta:
        model = User
        fields = ("email", "surname", "other_names", "level", "matric_number",
                  "password", "password2", "verification_token", "account_type")
        extra_kwargs = {
            # Required for students only; enforced conditionally in validate().
            "matric_number": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
                # Drop the validators ModelSerializer copies from the model field
                # (case-sensitive regex + uniqueness). They run before
                # validate_matric_number and would pre-empt its case-specific
                # message; that method performs both checks itself.
                "validators": [],
            },
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
        1. Validate format and require capital letters.
        2. Enforce uniqueness.

        A blank value is passed through untouched here — validate() rejects
        it for students and discards it for staff, since this field-level
        hook has no access to account_type.
        """
        if not value:
            return value

        normalized = _validate_matric_case(value)

        if User.objects.filter(matric_number=normalized).exists():
            raise serializers.ValidationError(
                "A user with this matric number already exists."
            )

        return normalized  # serializer.validated_data will contain the normalized form

    # ── Object-level validation ────────────────────────────────────────────

    def validate(self, attrs: dict) -> dict:
        from django.conf import settings
        from django.core import signing
        from .admin_whitelist import normalize_matric

        is_staff_signup = attrs.get("account_type") == User.AccountType.STAFF

        if is_staff_signup:
            # Staff never go through matric/level/roster verification.
            attrs.pop("verification_token", None)
            attrs.pop("level", None)
            attrs["matric_number"] = None
        else:
            if not attrs.get("level"):
                # DRF's HTML-form field parsing (multipart/urlencoded) collapses
                # an explicitly-blank value on a required=False, non-allow_blank
                # ChoiceField down to "absent" before it ever reaches the field's
                # own validator — so an explicitly-submitted '' looks identical
                # to the key being omitted entirely by the time it gets here.
                # Recover the distinction from the raw payload so a blank
                # submission still gets the choice-list message, not the
                # generic "omitted" one.
                if self.initial_data.get("level") == "":
                    raise serializers.ValidationError(
                        {"level": "Select your level: 100, 200, 300 or 400."}
                    )
                raise serializers.ValidationError({"level": "Select your level."})
            if not attrs.get("matric_number"):
                raise serializers.ValidationError({"matric_number": "Matric number is required."})

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

        attrs["full_name"] = compose_full_name(
            attrs.pop("surname"), attrs.pop("other_names")
        )
        return attrs

    # ── Create ─────────────────────────────────────────────────────────────

    def create(self, validated_data: dict) -> User:
        validated_data.pop("password2")
        password = validated_data.pop("password")
        level = validated_data.pop("level", None)
        account_type = validated_data.pop("account_type")

        is_staff_signup = account_type == User.AccountType.STAFF
        validated_data["account_type"] = account_type
        if is_staff_signup:
            # Pending until an Admin/Super Admin assigns them a role.
            validated_data["is_approved"] = False
        else:
            validated_data["role"] = User.Role.STUDENT

        # matric_number is already normalized by validate_matric_number
        with transaction.atomic():
            user: User = User.objects.create_user(password=password, **validated_data)
            if not is_staff_signup:
                # The profile carries the level the student chose. Department
                # etc. are filled in from the roster the first time it's opened.
                StudentProfile.objects.create(user=user, level=level)

        return user


# ─── LoginSerializer ───────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={"input_type": "password"})

    def validate(self, attrs: dict) -> dict:
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"email": ["No account found with this email. Please sign up."]}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"email": ["This account has been deactivated. Contact an admin for help."]}
            )
        if not user.check_password(password):
            raise serializers.ValidationError(
                {"password": ["Incorrect password. Please try again."]}
            )

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
        )
        read_only_fields = (
            "id",
            "email",
            "date_joined",
            "is_email_verified",
            "is_staff",
            "matric_number",
            "role",
        )


# ─── UserSerializer ────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    """Lightweight read-only user representation used in admin responses."""

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "matric_number", "is_staff", "role")
        read_only_fields = fields


# ─── AssignUserRoleSerializer ──────────────────────────────────────────────────

# Super Admin and the legacy 'user' role are excluded from the assignable
# set — Super Admin stays a manual/DB-only assignment, and 'user' is not a
# meaningful UI target (Student/Technician/etc. replace it).
_ROLE_ASSIGNMENT_EXCLUDED = {User.Role.SUPER_ADMIN, User.Role.USER}
_ASSIGNABLE_ROLE_CHOICES = [
    (value, label) for value, label in User.Role.choices
    if value not in _ROLE_ASSIGNMENT_EXCLUDED
]


class AssignUserRoleSerializer(serializers.Serializer):
    """
    Validates the role an Admin/Super Admin assigns to a user from their
    profile in User Management.
    """

    role = serializers.ChoiceField(choices=_ASSIGNABLE_ROLE_CHOICES)


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
    Step 2 — check that (email, surname + other names, matric_number) matches the
    Excel roster. On success, issues a short-lived signed token the registration
    endpoint requires.
    """
    email         = serializers.EmailField()
    surname       = serializers.CharField(
        max_length=100,
        error_messages={"required": "Surname is required.", "blank": "Surname is required."},
    )
    other_names   = serializers.CharField(
        max_length=150,
        error_messages={"required": "Other names are required.", "blank": "Other names are required."},
    )
    matric_number = serializers.CharField(max_length=20)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_matric_number(self, value: str) -> str:
        return _validate_matric_case(value)

    def validate(self, attrs: dict) -> dict:
        from .student_service import verify_student_identity

        full_name = compose_full_name(attrs["surname"], attrs["other_names"])
        record = verify_student_identity(full_name, attrs["matric_number"])
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
            "account_type",
            "is_approved",
            "is_staff",
            "is_active",
            "is_email_verified",
            "date_joined",
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

# ─── Device Token (mobile push notifications) ──────────────────────────────────

class DeviceTokenSerializer(serializers.Serializer):
    # Plain Serializer, not ModelSerializer: the view does an explicit
    # update_or_create on `token` (unique=True at the model level), so a
    # ModelSerializer's auto-generated UniqueValidator would wrongly reject
    # re-registering a device that's already in the table.
    token = serializers.CharField(max_length=255)
    platform = serializers.ChoiceField(choices=DeviceToken.Platform.choices)
