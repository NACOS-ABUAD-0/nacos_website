# backend/events/emails.py
"""
Ticket confirmation emails. Each event picks a design (Event.email_design) from EMAIL_DESIGNS.

Adding a design for a new event: add an entry below with its colours and wording (or its own
template for a different layout). It then appears in the admin event form's "Ticket email design"
dropdown. Events without a design of their own use "standard".
"""
from zoneinfo import ZoneInfo

from django.conf import settings
from django.template.loader import render_to_string

from .models import EventRegistration

# Events happen in Nigeria; the server clock is UTC.
LAGOS = ZoneInfo("Africa/Lagos")

DEFAULT_EMAIL_DESIGN = "standard"

EMAIL_DESIGNS = {
    # NACOS green on white; used for every event without a design of its own.
    "standard": {
        "label": "Standard (NACOS green)",
        "template": "events/emails/ticket.html",
        "greeting": "you're in. We've saved you a spot.",
        "doors_tip": "Doors open at {time} WAT. Please arrive on time.",
        "theme": {
            "color_scheme": "light",
            "page_bg": "#eef2f0", "card_bg": "#ffffff", "card_border": "#dde5e1",
            "accent": "#006E3A", "eyebrow": "#006E3A",
            "heading": "#0f1f17", "body": "#3f4a45", "muted": "#6f7b75", "faint": "#9aa59f",
            "divider": "#e1e8e4", "highlight_bg": "#d7f0e1", "highlight_text": "#00552d",
            "stub_border": "#dde5e1", "button_bg": "#006E3A", "button_text": "#ffffff",
            "title_font": "Georgia, 'Times New Roman', serif",
        },
    },
    # Movie Night (October 2026): dark cinema look, red accents, yellow highlight.
    "movie_night": {
        "label": "Movie Night (dark cinema)",
        "template": "events/emails/ticket.html",
        "greeting": "you're in. Grab your popcorn, we saved you a seat.",
        "doors_tip": "Doors open at {time} WAT. Come early for the best seats.",
        "theme": {
            "color_scheme": "dark",
            "page_bg": "#0b0707", "card_bg": "#160d0d", "card_border": "#2a1717",
            "accent": "#c8102e", "eyebrow": "#ef5466",
            "heading": "#ffffff", "body": "#d6c7c7", "muted": "#a08c8c", "faint": "#6f5f5f",
            "divider": "#3a2222", "highlight_bg": "#fde68a", "highlight_text": "#160d0d",
            "stub_border": "#ffffff", "button_bg": "#fde68a", "button_text": "#160d0d",
            "title_font": "Georgia, 'Times New Roman', serif",
        },
    },
}


def email_design_choices() -> list[dict]:
    return [{"value": key, "label": design["label"]} for key, design in EMAIL_DESIGNS.items()]


def _naira(kobo: int) -> str:
    naira = kobo / 100
    return f"₦{naira:,.0f}" if naira == int(naira) else f"₦{naira:,.2f}"


def _clock(moment) -> str:
    # "6:00 PM", without a leading zero (strftime's %-I isn't available on Windows).
    return moment.strftime("%I:%M %p").lstrip("0")


def _design(event) -> dict:
    return EMAIL_DESIGNS.get(event.email_design) or EMAIL_DESIGNS[DEFAULT_EMAIL_DESIGN]


def ticket_email_context(registration: EventRegistration) -> dict:
    event = registration.event
    design = _design(event)
    ticket_type = registration.ticket_type
    start = event.start_time.astimezone(LAGOS)
    venue = ticket_type.effective_venue if ticket_type else ("Online" if event.is_remote else event.location)
    holder = registration.name or registration.email

    # "Movie Night" -> "Movie" + highlighted "Night"; one-word titles aren't split.
    words = event.title.split()
    title_start, title_highlight = (" ".join(words[:-1]), words[-1]) if len(words) > 1 else (event.title, "")

    paid = registration.amount_kobo or (ticket_type.price_kobo if ticket_type else 0)

    tips = [design["doors_tip"].format(time=_clock(start))]
    if event.end_time:
        tips[0] += f" It runs until {_clock(event.end_time.astimezone(LAGOS))}."
    tips.append("Your code is single-use, so don't share a screenshot of it.")
    # Spell out where each ticket type goes when they're in different places.
    types = list(event.ticket_types.all())
    venues = {t.name: t.effective_venue for t in types}
    if len(types) > 1 and len(set(venues.values())) > 1:
        tips.append(" ".join(f"{name} is in {place}." for name, place in venues.items()))
    tips.append("If the QR code won't scan at the gate, give them your ticket code instead.")

    return {
        "t": design["theme"],
        "greeting": design["greeting"],
        "event": event,
        "title_start": title_start,
        "title_highlight": title_highlight,
        "first_name": holder.split()[0] if registration.name else "there",
        "holder": holder,
        "poster_url": event.poster_url,
        "date": f"{start:%a}, {start.day} {start:%b %Y}",
        "time": f"{_clock(start)} WAT",
        "venue": venue,
        "type_name": ticket_type.name if ticket_type else "Event",
        "price": _naira(paid) if paid else "FREE",
        "short_code": registration.short_code,
        "ticket_url": f"{settings.FRONTEND_URL.rstrip('/')}/tickets/{registration.token}",
        "tips": tips,
        "presented_by": settings.TICKET_EMAIL_PRESENTED_BY,
    }


def render_ticket_email(registration: EventRegistration) -> tuple[str, str, str]:
    """(subject, plain text, html) for a confirmed ticket, in the event's chosen design."""
    context = ticket_email_context(registration)
    subject = f"Your {context['type_name']} ticket: {registration.event.title}"
    text = "\n".join([
        f"Hi {context['first_name']}, {context['greeting']}",
        f"Your {context['type_name']} ticket for {registration.event.title} is confirmed.",
        "",
        f"Date: {context['date']}",
        f"Time: {context['time']}",
        f"Venue: {context['venue']}",
        f"Ticket: {context['type_name']} ({context['price']})",
        f"Ticket holder: {context['holder']}",
        f"Ticket code: {context['short_code']}",
        "",
        "Good to know:",
        *[f"- {tip}" for tip in context["tips"]],
        "",
        f"View your ticket and QR code: {context['ticket_url']}",
        "",
        f"Presented by {context['presented_by']}",
    ])
    return subject, text, render_to_string(_design(registration.event)["template"], context)
