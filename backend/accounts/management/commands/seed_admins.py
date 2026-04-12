# backend/accounts/management/commands/seed_admins.py
#
# Usage:
#   python manage.py seed_admins
#
# This command scans the ADMIN_WHITELIST and promotes any already-registered
# users whose name + matric match an entry. It is idempotent — safe to run
# multiple times without side effects.
#
# Run this:
#   1. After initial deployment.
#   2. After any database migration that touches the User table.
#   3. Whenever an admin's role appears to have been lost.

from django.core.management.base import BaseCommand, CommandError

from accounts.models import User
from accounts.admin_whitelist import (
    ADMIN_WHITELIST,
    MAX_ADMINS,
    normalize_matric,
    normalize_name,
)


class Command(BaseCommand):
    help = (
        "Promotes whitelisted users to admin role if they have already registered. "
        "Idempotent — safe to run multiple times."
    )

    def handle(self, *args, **kwargs) -> None:
        self.stdout.write(self.style.MIGRATE_HEADING("=== Seeding Admin Users ==="))

        promoted = 0
        already_admin = 0
        not_found = 0

        for entry in ADMIN_WHITELIST:
            matric = normalize_matric(entry["matric_number"])
            name = normalize_name(entry["full_name"])

            try:
                user = User.objects.get(matric_number=matric)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(
                        f"  ⚠  Not registered yet: '{entry['full_name']}' "
                        f"(matric: {matric}). Will auto-promote on registration."
                    )
                )
                not_found += 1
                continue

            # Verify name matches (extra safety)
            if normalize_name(user.full_name) != name:
                self.stdout.write(
                    self.style.ERROR(
                        f"  ✗  Matric {matric} found but name mismatch: "
                        f"stored='{user.full_name}', whitelist='{entry['full_name']}'. "
                        "Skipping."
                    )
                )
                continue

            if user.role == User.Role.ADMIN:
                self.stdout.write(
                    self.style.SUCCESS(f"  ✓  Already admin: {user.full_name} ({user.email})")
                )
                already_admin += 1
                continue

            # Check ceiling before promoting
            current_count = User.objects.filter(role=User.Role.ADMIN).count()
            if current_count >= MAX_ADMINS:
                raise CommandError(
                    f"Cannot promote {user.full_name}: admin limit ({MAX_ADMINS}) already reached."
                )

            user.role = User.Role.ADMIN
            user.save(update_fields=["role", "is_staff"])
            promoted += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"  ↑  Promoted to admin: {user.full_name} ({user.email})"
                )
            )

        self.stdout.write("")
        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f"Done — {promoted} promoted, {already_admin} already admin, "
                f"{not_found} not yet registered."
            )
        )
