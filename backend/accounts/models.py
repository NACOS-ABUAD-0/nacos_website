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

MATRIC_REGEX = RegexValidator(
    regex=r'^(\d{2}/[A-Z]{3}\d{2}/\d{3}|\d{12}[A-Z]{2})$',
    message=(
        "Matric number must be in format '23/SCI01/002' "
        "or JAMB Reg Number e.g. '202330217286FA'."
    )
)


# ─── Executive Roles ───────────────────────────────────────────────────────────

class ExecutiveRole(models.Model):
    """
    An executive title a user can be assigned (President, Software Director,
    ...). All executive titles share one permission tier (User.is_executive).
    The Super Admin adds and removes these from User Management; the original
    titles are seeded by migration 0010.
    """
    # Stored on User.role, so it must fit that field's max_length (30).
    value = models.SlugField(max_length=30, unique=True)
    label = models.CharField(max_length=100, unique=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "label"]

    def __str__(self) -> str:
        return self.label


# ─── Custom User Model ─────────────────────────────────────────────────────────

class User(AbstractUser):
    class Role(models.TextChoices):
        # Legacy default — no longer assigned to new signups, kept only so
        # historical rows still read. Never shown as an assignable option.
        USER = "user", "User"

        STUDENT = "student", "Student"
        TECHNICIAN = "technician", "Technician"
        LECTURER = "lecturer", "Lecturer"
        ADMIN = "admin", "Admin"
        SUPER_ADMIN = "super_admin", "Super Admin"

        # Executive titles (President, Software Director, ...) are not listed
        # here: they live in the ExecutiveRole table so the Super Admin can add
        # and remove them. See is_executive below.

    # Roles that carry full Admin-tier operational permissions (ban/delete
    # users, create attendance, edit user management, approve committees).
    # Role assignment itself is NOT included — that stays Admin/Super-Admin-only.
    ADMIN_TIER_ROLES = frozenset({Role.ADMIN, Role.LECTURER})

    class AccountType(models.TextChoices):
        STUDENT = "student", "Student"
        STAFF = "staff", "Staff"

    username = None
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)

    account_type = models.CharField(
        max_length=10,
        choices=AccountType.choices,
        default=AccountType.STUDENT,
        help_text="Chosen at signup. Staff accounts require admin approval (see is_approved).",
    )
    is_approved = models.BooleanField(
        default=True,
        help_text=(
            "Staff signups start False and can log in but see a pending-approval "
            "view until an Admin/Super Admin assigns them a role. Students are "
            "always True."
        ),
    )

    matric_number = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[MATRIC_REGEX],
        help_text="Normalized format: '23/SCI01/002' or '202330217286FA'.",
    )
    matric_edit_allowed = models.BooleanField(
        default=False,
        help_text=(
            "Super Admin toggle: while True the user may set/change their own "
            "matric number from their profile. Stays on until switched off."
        ),
    )

    # No `choices`: besides the fixed Role values above, a user may hold any
    # ExecutiveRole.value. Assignment is validated in AssignUserRoleSerializer.
    role = models.CharField(
        max_length=30,
        default=Role.USER,
        db_index=True,
    )

    is_active = models.BooleanField(default=True)
    is_email_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    # ── Face login ─────────────────────────────────────────────────────────────
    face_login_enabled = models.BooleanField(
        default=False,
        help_text="Set to True when the user has enrolled face embeddings.",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    @property
    def is_admin(self) -> bool:
        # Lecturer carries full Admin-tier permissions (see ADMIN_TIER_ROLES);
        # Executives deliberately do NOT satisfy this (they get is_executive
        # instead) — that's what keeps them off attendance/user-management.
        return self.role in (self.Role.ADMIN, self.Role.SUPER_ADMIN, self.Role.LECTURER) or self.is_staff

    @property
    def is_super_admin(self) -> bool:
        return self.role == self.Role.SUPER_ADMIN

    @property
    def is_executive(self) -> bool:
        # Restricted admin-like tier (committee applications, event sales).
        if self.role in self.Role.values:
            return False
        return ExecutiveRole.objects.filter(value=self.role).exists()

    @property
    def role_label(self) -> str:
        if self.role in self.Role.values:
            return self.Role(self.role).label
        executive = ExecutiveRole.objects.filter(value=self.role).only("label").first()
        return executive.label if executive else self.role

    @property
    def can_edit_matric(self) -> bool:
        """
        True if the Super Admin has opened matric editing for this user
        individually, or for their whole level (see MatricEditLevel).
        """
        if self.matric_edit_allowed:
            return True
        profile = getattr(self, "student_profile", None)
        return bool(
            profile and profile.level
            and MatricEditLevel.objects.filter(level=profile.level).exists()
        )

    @property
    def can_assign_roles(self) -> bool:
        """Only Admin/Super Admin may promote or reassign roles — not Lecturers, not Executives."""
        return self.role in (self.Role.ADMIN, self.Role.SUPER_ADMIN)

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"

    def save(self, *args, **kwargs) -> None:
        if self.matric_number:
            self.matric_number = self.matric_number.strip().upper()
        if not self.is_superuser:
            self.is_staff = self.role in (self.Role.ADMIN, self.Role.SUPER_ADMIN, self.Role.LECTURER)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]


# ─── Student Profile (Excel Cache) ─────────────────────────────────────────────

class StudentProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="student_profile"
    )
    department = models.CharField(max_length=100, blank=True)
    level = models.CharField(max_length=20, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)

    # Audit trail back to Excel source of truth
    excel_full_name = models.CharField(max_length=255, blank=True)
    excel_matric_number = models.CharField(max_length=20, blank=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts_studentprofile"
        verbose_name = "Student Profile"
        verbose_name_plural = "Student Profiles"

    def __str__(self) -> str:
        return f"{self.user.full_name} Profile"


# ─── Level-wide matric editing ─────────────────────────────────────────────────

class MatricEditLevel(models.Model):
    """
    A row here means matric editing is open for every student at `level`
    (e.g. all 100 level students right after the matric ceremony). The Super
    Admin opens it, students enter their numbers, then it's closed by deleting
    the row.
    """
    level = models.CharField(max_length=20, unique=True)
    opened_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    opened_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["level"]

    def __str__(self) -> str:
        return f"Matric editing open for {self.level} level"


# ─── Notification System ───────────────────────────────────────────────────────

class Notification(models.Model):
    class Type(models.TextChoices):
        COMMITTEE = "committee", "Committee"
        SYSTEM = "system", "System"

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20, choices=Type.choices, default=Type.COMMITTEE
    )
    is_read = models.BooleanField(default=False)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "accounts_notification"

    def __str__(self) -> str:
        return f"Notification for {self.user.email}: {self.title}"


# ─── Push Notifications (mobile) ───────────────────────────────────────────────

class DeviceToken(models.Model):
    """
    An Expo push token registered by the mobile app. One row per physical
    device — `token` is globally unique (Expo issues a fresh one per device
    install), so re-registering the same device just updates its `user` FK
    (handles logout/login as a different account on the same phone).
    """
    class Platform(models.TextChoices):
        IOS = "ios", "iOS"
        ANDROID = "android", "Android"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="device_tokens")
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=10, choices=Platform.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.platform} device for {self.user.email}"