# backend/resources/drive_client.py
"""
Low-level Google Drive API wrapper.

Responsibilities:
  - OAuth authentication + token refresh
  - Paginated file listing with shared-drive support
  - Exponential-backoff retry on rate limits (429) and transient errors (500/503)

This module has NO Django imports — it is a pure service layer.
"""

import logging
import os
import time
from pathlib import Path
from typing import Iterator, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

_SHARED_DRIVE_GET_PARAMS = {
    "supportsAllDrives": True,
}

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# Relative to the backend/ directory
_BACKEND_ROOT = Path(__file__).resolve().parent.parent

FOLDER_MIME = "application/vnd.google-apps.folder"

# Every files().list() call that touches a Shared Drive MUST include these.
_SHARED_DRIVE_PARAMS = {
    "supportsAllDrives": True,
    "includeItemsFromAllDrives": True,
    "corpora": "allDrives",
}

# All file fields we need in a single round-trip.
_FILE_FIELDS = (
    "id,name,mimeType,parents,webViewLink,webContentLink,"
    "createdTime,modifiedTime,size,description,fileExtension"
)


class _Backoff:
    """
    Wraps a single Drive API request with exponential back-off.

    Retries on HTTP 429 (quota), 500 (backend error), 503 (unavailable).
    Raises on any other error or after max_retries exhausted.
    """

    def __init__(self, max_retries: int = 6, base_delay: float = 1.0):
        self.max_retries = max_retries
        self.base_delay = base_delay

    def execute(self, request):
        for attempt in range(self.max_retries):
            try:
                return request.execute()
            except HttpError as exc:
                if exc.resp.status in (429, 500, 503) and attempt < self.max_retries - 1:
                    delay = self.base_delay * (2 ** attempt)
                    logger.warning(
                        "Drive API HTTP %s — retrying in %.1fs (attempt %d/%d)",
                        exc.resp.status, delay, attempt + 1, self.max_retries,
                    )
                    time.sleep(delay)
                else:
                    raise


class DriveClient:
    """
    Thin, testable wrapper around the Google Drive v3 API.

    Usage:
        client = DriveClient(credentials_file="credentials.json")
        for file in client.iter_files_in_folder(folder_id):
            print(file["name"])
    """

    def __init__(
        self,
        credentials_file: str = "credentials.json",
        token_file: Optional[str] = None,
    ):
        self.credentials_file = credentials_file
        self.token_file = token_file or str(_BACKEND_ROOT / "token.json")
        self._service = None
        self._backoff = _Backoff()

    # ── Authentication ──────────────────────────────────────────────────────────

    def _authenticate(self) -> Credentials:
        creds: Optional[Credentials] = None

        if os.path.exists(self.token_file):
            creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
                logger.info("OAuth access token refreshed.")
            else:
                if not os.path.exists(self.credentials_file):
                    raise FileNotFoundError(
                        f"credentials.json not found at: {self.credentials_file}"
                    )
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, SCOPES
                )
                creds = flow.run_local_server(port=0)
                logger.info("New OAuth token obtained via browser flow.")

            with open(self.token_file, "w") as fh:
                fh.write(creds.to_json())

        return creds

    @property
    def service(self):
        if self._service is None:
            creds = self._authenticate()
            self._service = build("drive", "v3", credentials=creds, cache_discovery=False)
        return self._service

    # ── File listing ────────────────────────────────────────────────────────────

    def iter_files_in_folder(
        self,
        folder_id: str,
        modified_since: Optional[str] = None,
    ) -> Iterator[dict]:
        """
        Yield every non-folder file directly inside `folder_id`.
        Handles pagination automatically.

        Args:
            folder_id:      Drive folder ID.
            modified_since: ISO-8601 timestamp; if provided, only files
                            modified after this date are returned.
        """
        query = (
            f"'{folder_id}' in parents"
            f" and trashed = false"
            f" and mimeType != '{FOLDER_MIME}'"
        )
        if modified_since:
            query += f" and modifiedTime > '{modified_since}'"

        page_token: Optional[str] = None
        while True:
            params = {
                "q": query,
                "spaces": "drive",
                "fields": f"nextPageToken, files({_FILE_FIELDS})",
                "pageSize": 1000,
                **_SHARED_DRIVE_PARAMS,
            }
            if page_token:
                params["pageToken"] = page_token

            response = self._backoff.execute(self.service.files().list(**params))

            yield from response.get("files", [])

            page_token = response.get("nextPageToken")
            if not page_token:
                break

    def list_subfolders(self, folder_id: str) -> list[dict]:
        """Return all immediate subfolders of `folder_id`."""
        query = (
            f"'{folder_id}' in parents"
            f" and trashed = false"
            f" and mimeType = '{FOLDER_MIME}'"
        )
        response = self._backoff.execute(
            self.service.files().list(
                q=query,
                spaces="drive",
                fields="files(id, name, mimeType)",
                **_SHARED_DRIVE_PARAMS,
            )
        )
        return response.get("files", [])

    def get_folder_name(self, folder_id: str) -> str:
        try:
            meta = self._backoff.execute(
                self.service.files().get(
                    fileId=folder_id,
                    fields="id,name",
                    supportsAllDrives=True,  # ← only valid param for .get()
                )
            )
            return meta.get("name", folder_id)
        except HttpError as exc:
            logger.warning("Could not fetch name for folder %s: %s", folder_id, exc)
            return folder_id