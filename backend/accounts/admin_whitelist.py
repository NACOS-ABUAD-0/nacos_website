# backend/accounts/admin_whitelist.py
#
# ─── SEALED ADMIN WHITELIST ────────────────────────────────────────────────────
# This file is the single source of truth for initial admin identities.
# Only modify this file with explicit authorization from all current admins.
# Both full_name AND matric_number must match for admin access to be granted.
# Comparison is case-insensitive; values are stored normalized (uppercase matric).
# ──────────────────────────────────────────────────────────────────────────────

from typing import TypedDict


class AdminEntry(TypedDict):
    full_name: str
    matric_number: str  # stored normalized (uppercase, stripped)


# ─── DO NOT MODIFY WITHOUT AUTHORIZATION ──────────────────────────────────────
ADMIN_WHITELIST: list[AdminEntry] = [
    {
        "full_name": "Abdulazeez Jamiu Oladipupo",
        "matric_number": "23/SCI01/002",
    },
    {
        "full_name": "BADA Najeebah Motunrayo",
        "matric_number": "22/SCI01/050",
    },
    {
        "full_name": "AMALAHA Jelfrey Chigozie",
        "matric_number": "23/SCI01/030",
    },
]
# ─── MAX ADMIN LIMIT (enforced at the view layer as well) ─────────────────────
MAX_ADMINS: int = 3


# ─── Utility Functions ─────────────────────────────────────────────────────────

def normalize_matric(matric: str) -> str:
    """
    Normalizes a matric number to its canonical form:
      - Strip leading/trailing whitespace
      - Convert to uppercase

    Example:
      "  23/sci01/002  " → "23/SCI01/002"
    """
    return matric.strip().upper()


def normalize_name(name: str) -> str:
    """
    Normalizes a full name for comparison:
      - Strip leading/trailing whitespace
      - Collapse internal whitespace
      - Convert to lowercase
    """
    return " ".join(name.strip().split()).lower()


def is_whitelisted_admin(full_name: str, matric_number: str) -> bool:
    """
    Returns True ONLY if BOTH the full name AND matric number match
    a whitelisted admin entry. Both comparisons are case-insensitive.

    Args:
        full_name:      The user's full name as provided during registration.
        matric_number:  The user's matric number as provided during registration.

    Returns:
        bool: True if the user is a whitelisted admin, False otherwise.
    """
    if not full_name or not matric_number:
        return False

    normalized_matric = normalize_matric(matric_number)
    normalized_name = normalize_name(full_name)

    for entry in ADMIN_WHITELIST:
        entry_matric = normalize_matric(entry["matric_number"])
        entry_name = normalize_name(entry["full_name"])

        if entry_matric == normalized_matric and entry_name == normalized_name:
            return True

    return False