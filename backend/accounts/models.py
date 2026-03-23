from django.db import models
import random
import string
from datetime import datetime
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser, BaseUserManager


# --- Custom User Manager ---

class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        if not full_name:
            raise ValueError("Users must have a full name")

        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, full_name, password, **extra_fields)


# --- Custom User Model ---
class User(AbstractUser):
    username = None  # Disable username

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)

    matric_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r'(^\d{2}/[a-z]{3}\d{2}/\d{3}$)|(^\d{12}[A-Z]{2}$)',
                message="Matric/JAMB number must be in format 23/sci01/002 or 202330217286FA"
            )
        ]
    )

    is_active = models.BooleanField(default=True)
    is_email_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()   # 🔥 Use the custom manager

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if not self.matric_number:
            year = datetime.now().year
            random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            self.matric_number = f"TEMP-{year}-{random_part}"
        super().save(*args, **kwargs)
