# backend/executives/management/commands/seed_executives.py
#
# Usage:
#   python manage.py seed_executives
#
# One-off import of the 2025/26 and 2026/27 administrations that used to be
# hard-coded in the frontend, so they can be managed from the admin panel from
# now on. Photos are NOT copied: each executive's photo_link points at the file
# the frontend already ships in public/images/executives/<year>-<year>/.
# (Photos uploaded later through the admin panel go to Cloudinary instead.)
#
# Idempotent: an executive is skipped if one with the same session, title and
# name already exists, so it never overwrites edits made in the admin panel.

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from executives.models import Executive

SEED_FILE = Path(__file__).resolve().parents[2] / 'seed_data.json'
PHOTO_BASE = '/images/executives/'


class Command(BaseCommand):
    help = 'Imports the 2025/26 and 2026/27 executives. Safe to run repeatedly.'

    def handle(self, *args, **options):
        if not SEED_FILE.exists():
            raise CommandError(f'Seed file not found: {SEED_FILE}')

        entries = json.loads(SEED_FILE.read_text(encoding='utf-8'))
        created = skipped = 0

        for entry in entries:
            _, was_created = Executive.objects.get_or_create(
                session=entry['session'],
                title=entry['title'],
                name=entry['name'],
                defaults={
                    'level': entry['level'],
                    'email': entry['email'],
                    'display_order': entry['display_order'],
                    'photo_link': f"{PHOTO_BASE}{entry['photo']}" if entry.get('photo') else '',
                },
            )
            label = f"{entry['session']} {entry['title']} — {entry['name']}"
            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f'  +  {label}'))
            else:
                skipped += 1
                self.stdout.write(f'  =  Already exists: {label}')

        self.stdout.write('')
        self.stdout.write(self.style.MIGRATE_HEADING(
            f'Done — {created} created, {skipped} already existed.'
        ))
