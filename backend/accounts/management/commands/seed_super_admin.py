# backend/accounts/management/commands/seed_super_admin.py
#
# Usage:
#   python manage.py seed_super_admin [--reset-password]
#
# Creates (or promotes) a super admin from environment variables, so no
# credential ever lives in the repo:
#
#   SUPER_ADMIN_EMAIL     required
#   SUPER_ADMIN_PASSWORD  required (must satisfy the project's password rules)
#   SUPER_ADMIN_NAME      optional, defaults to "Super Admin"
#
# A super admin can open the admin dashboard, delete student records, manage
# admins and use the Django admin site at /admin/.
#
# Safe to run on every deploy:
#   * Idempotent — an existing account is promoted, never duplicated.
#   * The password is only set when the account is created (or with
#     --reset-password), so a redeploy never clobbers a password changed later.
#   * Missing/invalid settings only print a warning and skip: a seeding problem
#     must never fail a deploy.

import os

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand

from accounts.models import User


class Command(BaseCommand):
    help = (
        "Creates or promotes a super admin from SUPER_ADMIN_EMAIL / "
        "SUPER_ADMIN_PASSWORD / SUPER_ADMIN_NAME. Idempotent."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--reset-password",
            action="store_true",
            help="Also set the password of an existing account from SUPER_ADMIN_PASSWORD.",
        )

    def handle(self, *args, **options) -> None:
        email = os.getenv("SUPER_ADMIN_EMAIL", "").strip().lower()
        password = os.getenv("SUPER_ADMIN_PASSWORD", "")
        name = os.getenv("SUPER_ADMIN_NAME", "").strip() or "Super Admin"

        if not email or not password:
            self.stdout.write(
                "seed_super_admin: SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping."
            )
            return

        user = User.objects.filter(email__iexact=email).first()

        if user is None:
            try:
                validate_password(password)
            except ValidationError as exc:
                self._skip(f"SUPER_ADMIN_PASSWORD is not acceptable: {' '.join(exc.messages)}")
                return

            user = User.objects.create_user(
                email=email,
                full_name=name,
                password=password,
                role=User.Role.SUPER_ADMIN,
                is_staff=True,
                is_superuser=True,
                is_email_verified=True,
            )
            self.stdout.write(self.style.SUCCESS(f"Created super admin {user.email}."))
            return

        # Existing account: promote it.
        changed = []
        if user.role != User.Role.SUPER_ADMIN:
            user.role = User.Role.SUPER_ADMIN
            changed.append("role")
        if not user.is_superuser:
            user.is_superuser = True
            changed.append("is_superuser")
        if not user.is_staff:
            user.is_staff = True
            changed.append("is_staff")
        if not user.is_active:
            user.is_active = True
            changed.append("is_active")

        if options["reset_password"]:
            try:
                validate_password(password, user)
            except ValidationError as exc:
                self._skip(f"SUPER_ADMIN_PASSWORD is not acceptable: {' '.join(exc.messages)}")
                return
            user.set_password(password)
            changed.append("password")

        if changed:
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f"Updated super admin {user.email}: {', '.join(changed)}.")
            )
        else:
            self.stdout.write(f"Super admin {user.email} already set up — nothing to do.")

    def _skip(self, reason: str) -> None:
        self.stderr.write(self.style.WARNING(f"seed_super_admin: {reason} Skipping."))
