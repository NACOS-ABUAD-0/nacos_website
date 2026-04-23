# backend/resources/management/commands/sync_drive_resources.py
"""
Management command: sync_drive_resources

Thin entry point — all business logic lives in SyncEngine.

Usage examples:

  # First full sync using env var DRIVE_FOLDER_ID
  python manage.py sync_drive_resources

  # Full sync with an explicit folder ID
  python manage.py sync_drive_resources --folder-id 1aY0l8s1lOGwZWOGZgGsQ2zPAlK8dWxdR

  # Incremental (only files modified since last run)
  python manage.py sync_drive_resources

  # Force full sync (ignore last-sync timestamp)
  python manage.py sync_drive_resources --full

  # Preview files without writing to DB
  python manage.py sync_drive_resources --dry-run

  # Also write resources_snapshot.json
  python manage.py sync_drive_resources --snapshot

  # Limit folder recursion depth
  python manage.py sync_drive_resources --max-depth 3
"""

import logging
import os
import time

from django.core.management.base import BaseCommand, CommandError

from resources.drive_client import DriveClient
from resources.sync_engine import SyncEngine

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Sync resources from Google Drive into the Django Resource model. "
        "Supports full syncs, incremental syncs, soft-delete detection, "
        "and JSON snapshot output."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--folder-id",
            type=str,
            default=os.environ.get("DRIVE_FOLDER_ID", ""),
            help=(
                "Google Drive root folder ID. "
                "Defaults to the DRIVE_FOLDER_ID environment variable."
            ),
        )
        parser.add_argument(
            "--credentials-file",
            type=str,
            default=os.environ.get("GOOGLE_CREDENTIALS_FILE", "credentials.json"),
            help="Path to your OAuth 2.0 credentials.json file.",
        )
        parser.add_argument(
            "--full",
            action="store_true",
            default=False,
            help="Force a full sync — ignores the last-sync timestamp.",
        )
        parser.add_argument(
            "--max-depth",
            type=int,
            default=5,
            help="Maximum subfolder recursion depth (default: 5).",
        )
        parser.add_argument(
            "--snapshot",
            action="store_true",
            default=False,
            help="Write a JSON snapshot of the folder tree after syncing.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Traverse Drive and log results without touching the database.",
        )

    def handle(self, *args, **options):
        folder_id        = options["folder_id"]
        credentials_file = options["credentials_file"]
        force_full       = options["full"]
        max_depth        = options["max_depth"]
        write_snapshot   = options["snapshot"]
        dry_run          = options["dry_run"]

        if not folder_id:
            raise CommandError(
                "No folder ID supplied. "
                "Pass --folder-id or set the DRIVE_FOLDER_ID environment variable."
            )

        self.stdout.write(self.style.MIGRATE_HEADING(
            "\n📂  Google Drive → Resources Sync\n"
        ))
        self.stdout.write(f"   Folder    : {folder_id}")
        self.stdout.write(f"   Full sync : {force_full}")
        self.stdout.write(f"   Max depth : {max_depth}")
        self.stdout.write(f"   Dry run   : {dry_run}\n")

        start = time.perf_counter()

        try:
            client = DriveClient(credentials_file=credentials_file)
            engine = SyncEngine(client=client, folder_id=folder_id)

            # ── Determine sync window ────────────────────────────────────────
            last_sync = None if force_full else engine.load_last_sync()

            if last_sync:
                self.stdout.write(f"🔄  Incremental sync since: {last_sync}")
            else:
                self.stdout.write("🆕  Running full sync")

            # ── Traverse ─────────────────────────────────────────────────────
            self.stdout.write("🔍  Traversing Drive folder tree…")
            flat_files, tree = engine.traverse(
                last_sync=last_sync,
                max_depth=max_depth,
            )

            total = len(flat_files)
            self.stdout.write(f"📦  Found {total} file(s)\n")

            if dry_run:
                for i, f in enumerate(flat_files, 1):
                    self.stdout.write(
                        f"   [{i:04d}]  {f['title']}"
                        f"  ({f['file_type']})"
                        f"  course={f['course_code'] or '—'}"
                        f"  year={f['year'] or '—'}"
                    )
                self.stdout.write(
                    self.style.WARNING("\n⚠️   Dry run — no changes written to DB.\n")
                )
                return

            if total == 0:
                self.stdout.write("✅  Nothing new to sync.")
                if not last_sync:
                    # Still advance the timestamp so next run is incremental
                    engine.save_last_sync()
                return

            # ── Upsert ───────────────────────────────────────────────────────
            self.stdout.write("💾  Syncing to database…")
            created, updated = engine.sync_to_db(flat_files)

            # ── Soft-delete (full syncs only) ────────────────────────────────
            soft_deleted = 0
            if not last_sync:
                seen_ids = {f["drive_file_id"] for f in flat_files}
                soft_deleted = engine.soft_delete_removed_files(seen_ids)

            # ── Advance sync window ──────────────────────────────────────────
            engine.save_last_sync()

            # ── Optional snapshot ────────────────────────────────────────────
            if write_snapshot:
                self.stdout.write("📄  Writing JSON snapshot…")
                engine.write_snapshot(tree, flat_files)

            elapsed = round(time.perf_counter() - start, 2)
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n✅  Sync complete in {elapsed}s\n"
                    f"    Created      : {created}\n"
                    f"    Updated      : {updated}\n"
                    f"    Soft-deleted : {soft_deleted}\n"
                )
            )

        except Exception as exc:
            logger.exception("Drive sync failed")
            raise CommandError(f"Sync failed: {exc}") from exc