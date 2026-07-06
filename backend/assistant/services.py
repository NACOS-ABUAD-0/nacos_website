# backend/assistant/services.py

import datetime
import logging

import requests
from django.conf import settings
from django.core.cache import cache
from django.db.models import Q

from projects.models import Project
from resources.models import Resource

logger = logging.getLogger(__name__)

GEMINI_MODEL = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

SYSTEM_PROMPT = (
    "You are the NACOS ABUAD assistant, helping computing students at ABUAD find "
    "academic resources and student projects, and answering general questions about "
    "the NACOS ABUAD community. Be concise and friendly. If relevant resources or "
    "projects are provided below, mention them by name with their link. If nothing "
    "relevant was found, say so plainly and answer generally instead of making "
    "things up."
)

FALLBACK_REPLY = "Sorry, I'm having trouble responding right now — please try again shortly."
BUSY_REPLY = "The assistant is getting a lot of use right now — please try again in a little while."

# Gemini's free tier is a shared quota across the whole app, not per-user.
# This is a soft daily budget so we fail gracefully with a friendly message
# instead of the whole feature silently breaking once Google's ceiling is
# hit. Not perfectly accurate across gunicorn's separate worker processes
# (same caveat as the login rate limiter) — good enough for its purpose.
DAILY_CALL_BUDGET = getattr(settings, "GEMINI_DAILY_CALL_BUDGET", 400)


def _daily_budget_key() -> str:
    return f"gemini_calls_{datetime.date.today().isoformat()}"


def _daily_budget_exceeded() -> bool:
    return cache.get(_daily_budget_key(), 0) >= DAILY_CALL_BUDGET


def _increment_daily_budget() -> None:
    key = _daily_budget_key()
    try:
        cache.incr(key)
    except ValueError:
        cache.set(key, 1, timeout=60 * 60 * 26)


def retrieve_context(query: str) -> str:
    """Lightweight keyword search against real Resources/Projects, formatted
    as a short text block to ground the assistant's reply. No embeddings/
    vector DB — unnecessary at this data scale."""
    resources = Resource.objects.filter(is_public=True).filter(
        Q(title__icontains=query) | Q(description__icontains=query) | Q(course_code__icontains=query)
    )[:5]
    projects = Project.objects.filter(status='published').filter(
        Q(title__icontains=query) | Q(description__icontains=query)
    )[:5]

    lines = []
    if resources:
        lines.append("Relevant academic resources:")
        for r in resources:
            lines.append(f"- {r.title} ({r.course_code or 'general'}): {r.url}")
    if projects:
        lines.append("Relevant student projects:")
        for p in projects:
            link = p.live_url or "no live link"
            lines.append(f"- {p.title} by {p.owner.full_name}: {link}")

    return "\n".join(lines)


def call_gemini(history: list[dict], user_message: str, context: str) -> str:
    """
    history: list of {"role": "user"|"assistant", "content": str}, oldest first.
    Returns the assistant's reply text, or a friendly fallback on any failure —
    never raises, so a Gemini hiccup never surfaces as a 500 or spams the
    admin-error-email alert.
    """
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        logger.warning("GEMINI_API_KEY not configured — assistant is disabled.")
        return "The AI assistant isn't set up yet — please check back later."

    if _daily_budget_exceeded():
        logger.warning("Gemini daily call budget exceeded.")
        return BUSY_REPLY

    system_text = SYSTEM_PROMPT
    if context:
        system_text += "\n\n" + context

    contents = [
        {"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]}
        for m in history
    ]
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    payload = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": system_text}]},
    }

    try:
        response = requests.post(
            GEMINI_URL,
            params={"key": api_key},
            json=payload,
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        _increment_daily_budget()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except requests.exceptions.Timeout:
        logger.warning("Gemini API call timed out.")
        return FALLBACK_REPLY
    except requests.exceptions.RequestException as exc:
        logger.warning("Gemini API call failed: %s", exc)
        return FALLBACK_REPLY
    except (KeyError, IndexError) as exc:
        logger.warning("Gemini API returned an unexpected shape: %s", exc)
        return FALLBACK_REPLY
