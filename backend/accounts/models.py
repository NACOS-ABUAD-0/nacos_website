# backend/accounts/models.py

from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser, BaseUserManager


# ─── Custom User Manager ───────────────────────────────────────────────────────

class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        if not full_name:
            raise ValueError("Users must have a full name.")

        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")

        if not extra_fields.get("is_staff"):
            raise ValueError("Superuser must have is_staff=True.")
        if not extra_fields.get("is_superuser"):
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, full_name, password, **extra_fields)


# ─── Matric Number Validator ───────────────────────────────────────────────────
#
# Accepted formats (after normalization to uppercase):
#   23/SCI01/002      → standard university matric
#   202330217286FA    → JAMB registration number
#
# Note: validation in the serializer runs AFTER normalization,
# so we validate against the uppercase form here.

MATRIC_REGEX = RegexValidator(
    regex=r'^(\d{2}/[A-Z]{3}\d{2}/\d{3}|\d{12}[A-Z]{2})$',
    message=(
        "Matric number must be in format '23/SCI01/002' "
        "or JAMB Reg Number e.g. '202330217286FA'."
    )
)


# ─── Custom User Model ─────────────────────────────────────────────────────────

class User(AbstractUser):
    """
    Custom user model.

    Key design decisions:
    ─────────────────────
    • username is disabled — email is the unique identifier.
    • matric_number is unique (NULL allowed so Django superusers can be
      created via management command without a matric number; uniqueness
      on NULLs is handled correctly by most databases).
    • role drives access control. is_staff is kept in sync with role so
      legacy code that checks is_staff continues to work.
    • Matric numbers are always normalized (uppercase, stripped) before
      storage via the overridden save() method.
    """

    class Role(models.TextChoices):
        USER = "user", "User"
        ADMIN = "admin", "Admin"

    # ── Core Identity Fields ───────────────────────────────────────────────
    username = None  # Disable username; email is the login identifier.
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)

    # ── Matric Number ──────────────────────────────────────────────────────
    # null=True  → allows Django management-command superusers without a matric.
    # unique=True → enforced at DB level; most DBs treat multiple NULLs as distinct.
    # blank=True  → allows admin panel / mgmt-command creation without matric.
    # API-level enforcement (required for all normal sign-ups) is in the serializer.
    matric_number = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[MATRIC_REGEX],
        help_text="Normalized format: '23/SCI01/002' or '202330217286FA'.",
    )

    # ── Role ───────────────────────────────────────────────────────────────
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
        db_index=True,
    )

    # ── Status Flags ───────────────────────────────────────────────────────
    is_active = models.BooleanField(default=True)
    is_email_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    # ── Auth Configuration ─────────────────────────────────────────────────
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    # ── Properties ─────────────────────────────────────────────────────────

    @property
    def is_admin(self) -> bool:
        """
        True if the user holds any form of elevated access.
        Checks both `role` and `is_staff` to stay resilient against
        any future state drift.
        """
        return self.role == self.Role.ADMIN or self.is_staff

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"

    # ── Save Hook ──────────────────────────────────────────────────────────

    def save(self, *args, **kwargs) -> None:
        """
        Pre-save normalization and role/is_staff synchronization.

        1. Normalize matric_number → strip whitespace, uppercase.
        2. Sync is_staff ← role so legacy is_staff checks remain valid.
           (Superusers keep is_staff=True regardless of role.)
        """
        # 1. Normalize matric number
        if self.matric_number:
            self.matric_number = self.matric_number.strip().upper()

        # 2. Sync is_staff with role (superusers always retain is_staff)
        if not self.is_superuser:
            self.is_staff = self.role == self.Role.ADMIN

        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]