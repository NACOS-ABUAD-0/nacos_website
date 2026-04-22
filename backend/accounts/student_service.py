# backend/accounts/student_service.py
"""
Student identity verification service.

Loads the Excel roster once per process (lru_cache) and exposes a single
public function: verify_student_identity(full_name, matric_number).

Matching rules:
  - Matric number: exact match after normalization (uppercase, strip).
  - Name: at least 2 words overlap between stored and supplied name,
    after lowercasing and removing non-alpha characters.
"""
import re
import logging
import functools
from pathlib import Path
from typing import Optional, NamedTuple

import openpyxl

logger = logging.getLogger(__name__)

EXCEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "2025_2026 List of Computing Students.xlsx"
)

# ── Column header aliases (case-insensitive) ────────────────────────────────
_NAME_ALIASES    = {"full name", "name", "student name", "fullname", "full_name"}
_MATRIC_ALIASES  = {"matric number", "matric no", "matric", "matric_number",
                    "reg number", "registration number", "regno"}
_DEPT_ALIASES    = {"department", "dept"}
_LEVEL_ALIASES   = {"level", "year", "class"}


class StudentRecord(NamedTuple):
    full_name: str
    matric_number: str
    department: str
    level: str


# ── Internal helpers ────────────────────────────────────────────────────────

def _normalize_name(name: str) -> str:
    """Lowercase, strip, collapse whitespace, strip non-alpha."""
    name = str(name or "").strip().lower()
    name = re.sub(r"[^a-z\s]", "", name)
    return re.sub(r"\s+", " ", name).strip()


def _normalize_matric(matric: str) -> str:
    return str(matric or "").strip().upper()


def _detect_col(headers: list[str], aliases: set[str]) -> Optional[int]:
    for i, h in enumerate(headers):
        if h.strip().lower() in aliases:
            return i
    return None


# ── Excel loader (cached) ───────────────────────────────────────────────────

@functools.lru_cache(maxsize=1)
def _load_records() -> list[StudentRecord]:
    """
    Parse the Excel file once and cache the result for the process lifetime.
    Call reload_records() after updating the Excel file without restarting.
    """
    if not EXCEL_PATH.exists():
        logger.error("Excel roster not found at: %s", EXCEL_PATH)
        return []

    records: list[StudentRecord] = []
    try:
        wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True, data_only=True)
        ws = wb.active
        headers_row: Optional[list[str]] = None
        name_col = matric_col = dept_col = level_col = None

        for row in ws.iter_rows(values_only=True):
            # ── First non-empty row → headers ──────────────────────────────
            if headers_row is None:
                if not any(row):
                    continue
                headers_row = [str(c).strip() if c is not None else "" for c in row]
                name_col   = _detect_col(headers_row, _NAME_ALIASES)
                matric_col = _detect_col(headers_row, _MATRIC_ALIASES)
                dept_col   = _detect_col(headers_row, _DEPT_ALIASES)
                level_col  = _detect_col(headers_row, _LEVEL_ALIASES)

                if name_col is None or matric_col is None:
                    logger.error(
                        "Could not find required columns. Detected headers: %s",
                        headers_row,
                    )
                    break
                continue

            if not any(row):
                continue  # blank row — skip

            def _get(idx: Optional[int]) -> str:
                if idx is None or idx >= len(row):
                    return ""
                v = row[idx]
                return str(v).strip() if v is not None else ""

            records.append(StudentRecord(
                full_name=_get(name_col),
                matric_number=_normalize_matric(_get(matric_col)),
                department=_get(dept_col),
                level=_get(level_col),
            ))

        wb.close()

    except Exception:
        logger.exception("Failed to load student roster from Excel")

    logger.info("Loaded %d student records from %s", len(records), EXCEL_PATH.name)
    return records


def reload_records() -> None:
    """Clear the cache so the Excel file is re-read on next call."""
    _load_records.cache_clear()
    logger.info("Student record cache cleared — will reload on next request.")


# ── Public API ──────────────────────────────────────────────────────────────

def verify_student_identity(
    full_name: str,
    matric_number: str,
) -> Optional[StudentRecord]:
    """
    Returns the matching StudentRecord if both conditions hold:
      1. Matric number matches exactly (normalized).
      2. At least 2 words in `full_name` appear in the stored name.
    Returns None on any mismatch.
    """
    records = _load_records()
    norm_matric = _normalize_matric(matric_number)

    for record in records:
        if record.matric_number != norm_matric:
            continue

        # Matric matched — verify name overlap
        db_words    = set(_normalize_name(record.full_name).split())
        input_words = set(_normalize_name(full_name).split())
        if len(db_words & input_words) >= 2:
            return record

    return None