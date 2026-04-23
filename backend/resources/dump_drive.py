# backend/dump_drive.py
"""
Run from the backend/ directory:
    python dump_drive.py

Writes: backend/resources_data.json
"""

import json
import os
from pathlib import Path

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES        = ["https://www.googleapis.com/auth/drive.readonly"]
FOLDER_ID     = "1aY0l8s1lOGwZWOGZgGsQ2zPAlK8dWxdR"
OUTPUT_FILE   = Path(__file__).parent / "resources_data.json"
CREDS_FILE    = Path(__file__).parent / "credentials.json"
TOKEN_FILE    = Path(__file__).parent / "token.json"
FOLDER_MIME   = "application/vnd.google-apps.folder"


# ── Auth ───────────────────────────────────────────────────────────────────────

def get_service():
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDS_FILE), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_FILE.write_text(creds.to_json())
    return build("drive", "v3", credentials=creds, cache_discovery=False)


# ── Fetch all files recursively ────────────────────────────────────────────────

def get_files(service, folder_id):
    files = []

    # Get subfolders first
    sub_resp = service.files().list(
        q=f"'{folder_id}' in parents and trashed=false and mimeType='{FOLDER_MIME}'",
        fields="files(id, name)",
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
        corpora="allDrives",
    ).execute()

    for folder in sub_resp.get("files", []):
        files.extend(get_files(service, folder["id"]))

    # Get files in this folder
    page_token = None
    while True:
        resp = service.files().list(
            q=f"'{folder_id}' in parents and trashed=false and mimeType!='{FOLDER_MIME}'",
            fields="nextPageToken, files(id, name, mimeType, webViewLink, webContentLink, size, createdTime, modifiedTime, description, fileExtension)",
            pageSize=1000,
            pageToken=page_token,
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
            corpora="allDrives",
        ).execute()

        files.extend(resp.get("files", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    return files


# ── Transform to clean shape ───────────────────────────────────────────────────

import re

def extract_course_code(name):
    match = re.search(r"\b([A-Z]{2,4}\s?\d{3})\b", name.upper())
    return match.group(1).replace(" ", "") if match else None

def extract_year(name):
    match = re.search(r"\b(20\d{2})\b", name)
    return match.group(1) if match else None

def get_download_url(f):
    if f.get("webContentLink"):
        return f["webContentLink"]
    exports = {
        "application/vnd.google-apps.document":     f"https://docs.google.com/document/d/{f['id']}/export?format=pdf",
        "application/vnd.google-apps.spreadsheet":  f"https://docs.google.com/spreadsheets/d/{f['id']}/export?format=xlsx",
        "application/vnd.google-apps.presentation": f"https://docs.google.com/presentation/d/{f['id']}/export?format=pdf",
    }
    return exports.get(f.get("mimeType"))

def get_file_size_display(size):
    if not size:
        return "Unknown"
    size = int(size)
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"

def transform(f):
    name = f.get("name", "")
    return {
        "id":                f["id"],
        "title":             name,
        "description":       f.get("description") or "",
        "url":               f.get("webViewLink", ""),
        "download_url":      get_download_url(f),
        "file_type":         f.get("mimeType", ""),
        "file_size":         int(f["size"]) if f.get("size") else None,
        "file_size_display": get_file_size_display(f.get("size")),
        "course_code":       extract_course_code(name),
        "year":              extract_year(name),
        "created_at":        f.get("createdTime", ""),
        "tags":              [],
        "category":          None,
        "download_count":    0,
    }


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("🔑 Authenticating...")
    service = get_service()

    print(f"🔍 Fetching files from folder {FOLDER_ID}...")
    raw_files = get_files(service, FOLDER_ID)

    print(f"📦 Found {len(raw_files)} files")
    resources = [transform(f) for f in raw_files]

    OUTPUT_FILE.write_text(json.dumps(resources, indent=2, default=str))
    print(f"✅ Saved {len(resources)} resources → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()