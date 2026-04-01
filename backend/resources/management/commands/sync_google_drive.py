# backend/resources/management/commands/sync_google_drive.py

import json
import os
import re
import time
from datetime import datetime, timezone

from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction

from resources.models import Resource

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow


class Command(BaseCommand):
    help = "Optimized sync from Google Drive (incremental + batched)"

    SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
    LAST_SYNC_FILE = "last_sync.json"

    # ---------------------------
    # ARGUMENTS
    # ---------------------------
    def add_arguments(self, parser):
        parser.add_argument(
            "--folder-id",
            type=str,
            required=True,
            help="Google Drive folder ID",
        )
        parser.add_argument(
            "--credentials-file",
            type=str,
            default="credentials.json",
        )

    # ---------------------------
    # AUTH
    # ---------------------------
    def authenticate(self, credentials_file):
        creds = None
        token_file = "token.json"

        if os.path.exists(token_file):
            creds = Credentials.from_authorized_user_file(token_file, self.SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    credentials_file, self.SCOPES
                )
                creds = flow.run_local_server(port=0)

            with open(token_file, "w") as token:
                token.write(creds.to_json())

        return creds

    # ---------------------------
    # LAST SYNC HANDLING
    # ---------------------------
    def load_last_sync(self):
        if os.path.exists(self.LAST_SYNC_FILE):
            with open(self.LAST_SYNC_FILE) as f:
                return json.load(f).get("last_sync")
        return None

    def save_last_sync(self):
        with open(self.LAST_SYNC_FILE, "w") as f:
            json.dump(
                {"last_sync": datetime.now(timezone.utc).isoformat()}, f
            )

    # ---------------------------
    # FETCH FILES (INCREMENTAL)
    # ---------------------------
    def fetch_files(self, service, folder_id, last_sync=None):
        files = []
        page_token = None

        query = f"'{folder_id}' in parents and trashed = false"

        if last_sync:
            query += f" and modifiedTime > '{last_sync}'"

        while True:
            response = (
                service.files()
                .list(
                    q=query,
                    spaces="drive",
                    fields="nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink)",
                    pageSize=500,
                    pageToken=page_token,
                )
                .execute()
            )

            files.extend(response.get("files", []))

            page_token = response.get("nextPageToken")
            if not page_token:
                break

        return files

    # ---------------------------
    # OPTIONAL: LIMITED RECURSION
    # ---------------------------
    def fetch_with_subfolders(self, service, folder_id, depth=0, max_depth=3):
        if depth > max_depth:
            return []

        all_files = []

        items = self.fetch_files(service, folder_id)

        for item in items:
            if item["mimeType"] == "application/vnd.google-apps.folder":
                all_files.extend(
                    self.fetch_with_subfolders(
                        service, item["id"], depth + 1, max_depth
                    )
                )
            else:
                all_files.append(item)

        return all_files

    # ---------------------------
    # EXTRACT COURSE INFO
    # ---------------------------
    def extract_course_info(self, file_name):
        course_pattern = r"[A-Z]{3,4}\s?\d{3}"
        year_pattern = r"(?:20)\d{2}"

        course_match = re.findall(course_pattern, file_name.upper())
        year_match = re.findall(year_pattern, file_name)

        course_code = (
            course_match[0].replace(" ", "") if course_match else None
        )
        year = year_match[0] if year_match else None

        return course_code, year

    # ---------------------------
    # BULK UPSERT
    # ---------------------------
    def bulk_upsert(self, files):
        file_ids = [f["id"] for f in files]

        existing_objects = {
            obj.drive_file_id: obj
            for obj in Resource.objects.filter(drive_file_id__in=file_ids)
        }

        to_create = []
        to_update = []

        for file_data in files:
            course_code, year = self.extract_course_info(file_data["name"])

            if file_data["id"] in existing_objects:
                # ✅ UPDATE existing object (has PK)
                obj = existing_objects[file_data["id"]]

                obj.title = file_data["name"]
                obj.url = file_data.get("webViewLink")
                obj.course_code = course_code
                obj.year = year
                obj.file_type = file_data["mimeType"]
                obj.drive_metadata = {
                    "modified_time": file_data.get("modifiedTime")
                }

                to_update.append(obj)

            else:
                # ✅ CREATE new object
                to_create.append(
                    Resource(
                        drive_file_id=file_data["id"],
                        title=file_data["name"],
                        url=file_data.get("webViewLink"),
                        course_code=course_code,
                        year=year,
                        file_type=file_data["mimeType"],
                        drive_metadata={
                            "modified_time": file_data.get("modifiedTime")
                        },
                    )
                )

        if to_create:
            Resource.objects.bulk_create(to_create, batch_size=500)

        if to_update:
            Resource.objects.bulk_update(
                to_update,
                ["title", "url", "course_code", "year", "file_type", "drive_metadata"],
                batch_size=500,
            )

        return len(to_create), len(to_update)

    # ---------------------------
    # MAIN
    # ---------------------------
    def handle(self, *args, **options):
        folder_id = options["folder_id"]
        credentials_file = options["credentials_file"]

        self.stdout.write(f"\n🚀 Starting sync for folder: {folder_id}")

        start_time = time.time()

        try:
            creds = self.authenticate(credentials_file)
            service = build("drive", "v3", credentials=creds)

            last_sync = self.load_last_sync()

            if last_sync:
                self.stdout.write(f"🔄 Incremental sync since: {last_sync}")
            else:
                self.stdout.write("🆕 First full sync")

            # Fetch files (you can switch to fetch_with_subfolders if needed)
            files = self.fetch_files(service, folder_id, last_sync)

            self.stdout.write(f"📦 Found {len(files)} files")

            if not files:
                self.stdout.write("✅ Nothing to sync")
                return

            # Progress logging
            for i, f in enumerate(files[:10], 1):
                self.stdout.write(f"Preview {i}: {f['name']}")

            # Bulk DB operations
            with transaction.atomic():
                created, updated = self.bulk_upsert(files)

            self.save_last_sync()

            duration = round(time.time() - start_time, 2)

            self.stdout.write(
                self.style.SUCCESS(
                    f"\n✅ Sync complete in {duration}s | Created: {created}, Updated: {updated}"
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error: {str(e)}")
            )