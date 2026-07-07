# backend/assistant/services.py

import datetime
import logging
import re

import requests
from django.conf import settings
from django.core.cache import cache
from django.db.models import Q

from projects.models import Project, SkillTag
from resources.models import Resource, ResourceTag

logger = logging.getLogger(__name__)

GEMINI_MODEL = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

# Static, always-included (not retrieved) map of "how do I do X" -> route, so
# the assistant can direct a lost student to the right page instead of only
# ever talking about resources/projects it found via retrieve_context().
SITE_GUIDE = (
    "Where things are on the NACOS ABUAD site — mention the exact page when "
    "guiding a student who seems lost:\n"
    "- Submit/upload a project: My Projects -> New Project (/projects/new)\n"
    "- Edit your project: open it from My Projects (/projects/:id/edit)\n"
    "- Your own projects: /my-projects · Liked projects: /liked-projects\n"
    "- Find a project needing collaborators: /collaboration-hub\n"
    "- Collaboration requests you sent: /my-collaborations\n"
    "- Collaboration requests received on your project: /collaboration-requests\n"
    "- Browse/download resources (notes, past questions): /resources\n"
    "- Submit your own resource: on /resources, click \"Submit a Resource\"\n"
    "- Browse/register for events: /events\n"
    "- Join a committee: /committees, then /committees/:id/apply\n"
    "- File a complaint (can be anonymous): /complaints\n"
    "- Dashboard: /dashboard · Profile: /profile · Scan attendance: /attendance/scan"
)

SYSTEM_PROMPT = (
    "You are the NACOS ABUAD assistant, helping computing students at ABUAD find "
    "academic resources and student projects, and answering general questions about "
    "the NACOS ABUAD community. Be concise and friendly. If relevant resources or "
    "projects are provided below, mention them by name with their link. If nothing "
    "relevant was found, say so plainly and answer generally instead of making "
    "things up.\n\n" + SITE_GUIDE
)

# Small, deliberately conservative stopword list — just enough to strip
# common sentence scaffolding so the remaining words are meaningful search
# terms. Not a general-purpose NLP stopword list.
_STOPWORDS = {
    "a", "an", "the", "is", "was", "were", "are", "am", "be", "been", "being",
    "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
    "my", "your", "his", "its", "our", "their",
    "this", "that", "these", "those", "there", "here",
    "and", "or", "but", "if", "so", "as", "of", "in", "on", "at", "by", "for",
    "with", "about", "against", "between", "into", "through", "during", "to",
    "from", "up", "down", "out", "off", "over", "under", "again", "further",
    "any", "all", "some", "no", "nor", "not", "only", "own", "same", "than",
    "too", "very", "can", "will", "just", "should", "now", "do", "does", "did",
    "have", "has", "had", "having", "what", "which", "who", "whom", "how",
    "why", "when", "where", "website", "site", "nacos", "tech", "stack",
}


def _extract_keywords(query: str) -> list[str]:
    words = re.findall(r"[a-zA-Z0-9+#.]+", query.lower())
    return [w for w in words if len(w) > 2 and w not in _STOPWORDS]

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
    """Search real Resources/Projects for two complementary signals, formatted
    as a short text block to ground the assistant's reply. No embeddings/
    vector DB — unnecessary at this data scale.

    1. Extracted keywords (see _extract_keywords) matched against title/
       description/course_code — handles "tell me about data structures".
    2. Exact tag-name matches against the raw query — the strongest signal
       for tech-stack questions ("react or tailwind"), and avoids relying on
       keyword tokenization for multi-word/punctuated tag names.
    """
    keywords = _extract_keywords(query)
    query_lower = query.lower()

    resource_tag_matches = [
        t for t in ResourceTag.objects.values_list('name', flat=True) if t.lower() in query_lower
    ]
    project_tag_matches = [
        t for t in SkillTag.objects.values_list('name', flat=True) if t.lower() in query_lower
    ]

    if not keywords and not resource_tag_matches and not project_tag_matches:
        return ""

    resource_q = Q()
    for kw in keywords:
        resource_q |= Q(title__icontains=kw) | Q(description__icontains=kw) | Q(course_code__icontains=kw)
    if resource_tag_matches:
        resource_q |= Q(tags__name__in=resource_tag_matches)

    project_q = Q()
    for kw in keywords:
        project_q |= Q(title__icontains=kw) | Q(description__icontains=kw)
    if project_tag_matches:
        project_q |= Q(tags__name__in=project_tag_matches)

    resources = (
        Resource.objects.filter(is_public=True, status=Resource.Status.APPROVED)
        .filter(resource_q)
        .distinct()[:5]
        if resource_q
        else Resource.objects.none()
    )
    projects = (
        Project.objects.filter(status='published').filter(project_q).distinct()[:5]
        if project_q
        else Project.objects.none()
    )

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
