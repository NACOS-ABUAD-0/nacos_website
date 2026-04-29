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
        USER = "user", "User"
        ADMIN = "admin", "Admin"

    username = None
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)

    matric_number = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[MATRIC_REGEX],
        help_text="Normalized format: '23/SCI01/002' or '202330217286FA'.",
    )

    role = models.CharField(
        max_length=10,
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
        return self.role == self.Role.ADMIN or self.is_staff

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"

    def save(self, *args, **kwargs) -> None:
        if self.matric_number:
            self.matric_number = self.matric_number.strip().upper()
        if not self.is_superuser:
            self.is_staff = self.role == self.Role.ADMIN
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