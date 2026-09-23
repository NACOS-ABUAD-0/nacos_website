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

        # ── Executive tier — fixed named titles, all share one permission
        # class (see EXECUTIVE_ROLES / is_executive below). Extend this list
        # in code if a future session introduces a new title.
        PRESIDENT = "president", "President"
        VICE_PRESIDENT = "vice_president", "Vice President"
        GENERAL_SECRETARY = "general_secretary", "General Secretary"
        ASST_GENERAL_SECRETARY = "asst_general_secretary", "Assistant General Secretary"
        FINANCIAL_SECRETARY = "financial_secretary", "Financial Secretary"
        SOFTWARE_DIRECTOR = "software_director", "Software Director"
        HARDWARE_DIRECTOR = "hardware_director", "Hardware Director"
        SOCIAL_DIRECTOR = "social_director", "Social Director"
        WELFARE_DIRECTOR = "welfare_director", "Welfare Director"
        ACADEMIC_DIRECTOR = "academic_director", "Academic Director"
        PUBLIC_RELATIONS_OFFICER = "public_relations_officer", "Public Relations Officer"
        SPORTS_DIRECTOR = "sports_director", "Sports Director"
        CHIEF_OF_STAFF = "chief_of_staff", "Chief of Staff"

    # Roles that carry full Admin-tier operational permissions (ban/delete
    # users, create attendance, edit user management, approve committees).
    # Role assignment itself is NOT included — that stays Admin/Super-Admin-only.
    ADMIN_TIER_ROLES = frozenset({Role.ADMIN, Role.LECTURER})

    # The 13 fixed executive titles — restricted admin-like tier (committee
    # applications only; see is_executive).
    EXECUTIVE_ROLES = frozenset({
        Role.PRESIDENT, Role.VICE_PRESIDENT, Role.GENERAL_SECRETARY,
        Role.ASST_GENERAL_SECRETARY, Role.FINANCIAL_SECRETARY,
        Role.SOFTWARE_DIRECTOR, Role.HARDWARE_DIRECTOR, Role.SOCIAL_DIRECTOR,
        Role.WELFARE_DIRECTOR, Role.ACADEMIC_DIRECTOR,
        Role.PUBLIC_RELATIONS_OFFICER, Role.SPORTS_DIRECTOR, Role.CHIEF_OF_STAFF,
    })

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

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
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
        return self.role in self.EXECUTIVE_ROLES

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