# backend/resources/sync_engine.py
"""
Drive → Django sync pipeline.

Responsibilities:
  - Recursive folder traversal (files + tree structure)
  - Metadata transformation (Drive dict → Resource field dict)
  - Automatic ResourceCategory + ResourceTag resolution (get-or-create)
  - Bulk DB upsert with tag association
  - Soft-delete of files removed from Drive (full sync only)
  - JSON snapshot output for auditing

No management-command logic lives here — the engine is importable and testable
in isolation.
"""

import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from django.db import transaction

from .drive_client import DriveClient
from .models import Resource, ResourceCategory, ResourceTag

logger = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
LAST_SYNC_FILE = _BACKEND_ROOT / "last_sync.json"
SNAPSHOT_FILE  = _BACKEND_ROOT / "resources_snapshot.json"

# ── MIME → human-readable category ────────────────────────────────────────────
# Exact matches checked first; prefix matches (ending with "/") as fallback.
_MIME_TO_CATEGORY: dict[str, str] = {
    "application/pdf":                                          "PDF Documents",
    "application/vnd.google-apps.document":                    "Documents",
    "application/vnd.google-apps.spreadsheet":                 "Spreadsheets",
    "application/vnd.google-apps.presentation":                "Presentations",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":   "Documents",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         "Spreadsheets",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "Presentations",
    "video/":  "Videos",
    "image/":  "Images",
    "audio/":  "Audio",
}

_COURSE_CODE_RE = re.compile(r"\b([A-Z]{2,4}\s?\d{3})\b")
_YEAR_RE        = re.compile(r"\b(20\d{2})\b")

# Google native formats → PDF / Office export URLs
_EXPORT_URLS: dict[str, str] = {
    "application/vnd.google-apps.document":
        "https://docs.google.com/document/d/{id}/export?format=pdf",
    "application/vnd.google-apps.spreadsheet":
        "https://docs.google.com/spreadsheets/d/{id}/export?format=xlsx",
    "application/vnd.google-apps.presentation":
        "https://docs.google.com/presentation/d/{id}/export?format=pdf",
}


class SyncEngine:
    """
    Orchestrates the complete Drive → Django Resource sync.

    Args:
        client:    Authenticated DriveClient instance.
        folder_id: Root Drive folder to sync from.
    """

    def __init__(self, client: DriveClient, folder_id: str):
        self.client    = client
        self.folder_id = folder_id

        # In-process caches to avoid redundant get_or_create calls
        self._categories: dict[str, ResourceCategory] = {}
        self._tags:       dict[str, ResourceTag]       = {}

    # ── Last-sync timestamp ────────────────────────────────────────────────────

    def load_last_sync(self) -> Optional[str]:
        if LAST_SYNC_FILE.exists():
            with LAST_SYNC_FILE.open() as fh:
                return json.load(fh).get("last_sync")
        return None

    def save_last_sync(self) -> None:
        with LAST_SYNC_FILE.open("w") as fh:
            json.dump({"last_sync": datetime.now(timezone.utc).isoformat()}, fh)
        logger.debug("Last-sync timestamp saved.")

    # ── Metadata helpers ───────────────────────────────────────────────────────

    def _extract_course_code(self, name: str) -> Optional[str]:
        match = _COURSE_CODE_RE.search(name.upper())
        return match.group(1).replace(" ", "") if match else None

    def _extract_year(self, name: str) -> Optional[str]:
        match = _YEAR_RE.search(name)
        return match.group(1) if match else None

    def _resolve_category(self, mime_type: str) -> Optional[ResourceCategory]:
        # Try exact match first, then prefix match
        label = _MIME_TO_CATEGORY.get(mime_type)
        if label is None:
            for prefix, name in _MIME_TO_CATEGORY.items():
                if prefix.endswith("/") and mime_type.startswith(prefix):
                    label = name
                    break
        if label is None:
            major = mime_type.split("/")[0]
            label = f"{major.capitalize()} Files"

        if label not in self._categories:
            cat, _ = ResourceCategory.objects.get_or_create(name=label)
            self._categories[label] = cat
        return self._categories[label]

    def _resolve_tags(
        self, mime_type: str, course_code: Optional[str]
    ) -> list[ResourceTag]:
        names: set[str] = set()

        if course_code:
            names.add(course_code)
            prefix = re.match(r"^([A-Z]+)", course_code)
            if prefix:
                names.add(prefix.group(1))

        # Simplified type tag
        type_label = None
        if "pdf" in mime_type:                               type_label = "PDF"
        elif "spreadsheet" in mime_type or "excel" in mime_type: type_label = "Spreadsheet"
        elif "document" in mime_type or "word" in mime_type:     type_label = "Document"
        elif "presentation" in mime_type or "powerpoint" in mime_type: type_label = "Presentation"
        elif "video" in mime_type:                           type_label = "Video"
        elif "image" in mime_type:                           type_label = "Image"
        elif "audio" in mime_type:                           type_label = "Audio"
        if type_label:
            names.add(type_label)

        tags: list[ResourceTag] = []
        for name in names:
            if name not in self._tags:
                tag, _ = ResourceTag.objects.get_or_create(name=name)
                self._tags[name] = tag
            tags.append(self._tags[name])
        return tags

    def _build_download_url(self, file_data: dict) -> Optional[str]:
        """
        Prefer webContentLink (set by Drive for binary files).
        For Google-native formats, construct an export URL.
        """
        if file_data.get("webContentLink"):
            return file_data["webContentLink"]
        template = _EXPORT_URLS.get(file_data.get("mimeType", ""))
        if template:
            return template.format(id=file_data["id"])
        return None

    def _transform(self, raw: dict, folder_path: str) -> dict:
        """Convert a raw Drive file dict into a Resource field dictionary."""
        name        = raw.get("name", "")
        course_code = self._extract_course_code(name)
        year        = self._extract_year(name)
        size        = raw.get("size")

        return {
            "drive_file_id": raw["id"],
            "title":         name,
            "description":   raw.get("description") or "",
            "url":           raw.get("webViewLink", ""),
            "download_url":  self._build_download_url(raw),
            "course_code":   course_code,
            "year":          year,
            "file_type":     raw.get("mimeType", ""),
            "file_size":     int(size) if size else None,
            "is_public":     True,
            "drive_metadata": {
                "created_time":   raw.get("createdTime"),
                "modified_time":  raw.get("modifiedTime"),
                "file_extension": raw.get("fileExtension"),
                "parents":        raw.get("parents", []),
                "folder_path":    folder_path,
            },
            # Internal keys — stripped before Resource(**) construction
            "_mime":   raw.get("mimeType", ""),
        }

    # ── Recursive traversal ────────────────────────────────────────────────────

    def traverse(
        self,
        folder_id: Optional[str] = None,
        last_sync: Optional[str] = None,
        path: str = "",
        depth: int = 0,
        max_depth: int = 5,
    ) -> tuple[list[dict], dict]:
        """
        Recursively traverse the Drive folder tree.

        Returns:
            flat_files: list of _transform() dicts (one per file)
            tree:       nested dict preserving folder hierarchy
        """
        folder_id = folder_id or self.folder_id

        if depth > max_depth:
            logger.warning("Max depth %d reached — skipping folder %s", max_depth, folder_id)
            return [], {"name": folder_id, "type": "folder", "children": [], "truncated": True}

        folder_name = self.client.get_folder_name(folder_id)
        current_path = f"{path}/{folder_name}".lstrip("/")

        tree: dict = {
            "name":     folder_name,
            "id":       folder_id,
            "path":     current_path,
            "type":     "folder",
            "children": [],
        }
        flat_files: list[dict] = []

        # Files in this folder (incremental filter applied)
        for raw in self.client.iter_files_in_folder(folder_id, modified_since=last_sync):
            transformed = self._transform(raw, folder_path=current_path)
            flat_files.append(transformed)
            tree["children"].append({
                "name":          raw.get("name"),
                "id":            raw["id"],
                "type":          "file",
                "mime_type":     raw.get("mimeType"),
                "path":          f"{current_path}/{raw.get('name')}",
                "modified_time": raw.get("modifiedTime"),
            })

        # Subfolders (always traversed — a folder's modifiedTime does NOT
        # update when its children change, so we can't apply last_sync here)
        for subfolder in self.client.list_subfolders(folder_id):
            child_files, child_tree = self.traverse(
                folder_id=subfolder["id"],
                last_sync=last_sync,
                path=current_path,
                depth=depth + 1,
                max_depth=max_depth,
            )
            flat_files.extend(child_files)
            tree["children"].append(child_tree)

        logger.debug(
            "Folder '%s' (depth %d): %d file(s), %d subfolder(s)",
            folder_name, depth,
            sum(1 for c in tree["children"] if c["type"] == "file"),
            sum(1 for c in tree["children"] if c["type"] == "folder"),
        )

        return flat_files, tree

    # ── DB upsert ──────────────────────────────────────────────────────────────

    def sync_to_db(self, files: list[dict]) -> tuple[int, int]:
        """
        Upsert `files` into the Resource table.

        Returns:
            (created_count, updated_count)
        """
        if not files:
            return 0, 0

        drive_ids = [f["drive_file_id"] for f in files]
        existing: dict[str, Resource] = {
            r.drive_file_id: r
            for r in Resource.objects.filter(drive_file_id__in=drive_ids)
        }

        to_create:  list[Resource]         = []
        to_update:  list[Resource]         = []
        tags_map:   dict[str, list[ResourceTag]] = {}

        for file_data in files:
            drive_id = file_data["drive_file_id"]
            mime     = file_data.pop("_mime", file_data["file_type"])
            category = self._resolve_category(mime)
            tags     = self._resolve_tags(mime, file_data["course_code"])
            tags_map[drive_id] = tags

            if drive_id in existing:
                obj = existing[drive_id]
                for field, value in file_data.items():
                    setattr(obj, field, value)
                obj.category = category
                to_update.append(obj)
            else:
                to_create.append(Resource(category=category, **file_data))

        created = updated = 0

        with transaction.atomic():
            if to_create:
                Resource.objects.bulk_create(to_create, batch_size=500)
                created = len(to_create)
                # Re-fetch to guarantee PKs (bulk_create may not populate them
                # on every database engine)
                created_ids = [obj.drive_file_id for obj in to_create]
                for obj in Resource.objects.filter(drive_file_id__in=created_ids):
                    if obj.drive_file_id in tags_map:
                        obj.tags.set(tags_map[obj.drive_file_id])

            if to_update:
                Resource.objects.bulk_update(
                    to_update,
                    fields=[
                        "title", "description", "url", "download_url",
                        "course_code", "year", "file_type", "file_size",
                        "drive_metadata", "is_public", "category",
                    ],
                    batch_size=500,
                )
                updated = len(to_update)
                for obj in to_update:
                    if obj.drive_file_id in tags_map:
                        obj.tags.set(tags_map[obj.drive_file_id])

        logger.info("DB upsert complete — created: %d, updated: %d", created, updated)
        return created, updated

    def soft_delete_removed_files(self, seen_drive_ids: set[str]) -> int:
        """
        Mark as is_public=False any Resource whose Drive file no longer exists
        in the folder. Only called during full syncs to avoid false positives
        from incremental filtering.
        """
        count = (
            Resource.objects
            .exclude(drive_file_id__in=seen_drive_ids)
            .filter(is_public=True)
            .update(is_public=False)
        )
        if count:
            logger.info(
                "Soft-deleted %d resource(s) no longer present in Drive.", count
            )
        return count

    # ── JSON snapshot ──────────────────────────────────────────────────────────

    def write_snapshot(self, tree: dict, flat_files: list[dict]) -> None:
        """
        Write a full audit snapshot to resources_snapshot.json.
        The flat_files list has already had _mime stripped by this point.
        """
        snapshot = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "folder_id":    self.folder_id,
            "total_files":  len(flat_files),
            "tree":         tree,
        }
        with SNAPSHOT_FILE.open("w") as fh:
            json.dump(snapshot, fh, indent=2, default=str)
        logger.info("Snapshot written → %s", SNAPSHOT_FILE)