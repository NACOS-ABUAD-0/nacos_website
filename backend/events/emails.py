# backend/events/emails.py
"""
Ticket confirmation emails. Each event picks a design (Event.email_design) from EMAIL_DESIGNS, or
"custom", where admins choose light/dark, two colours and the wording themselves (Event.email_custom).
The design only sets the look; holder name, code, venue, price and times are filled in per ticket.

Adding a design for a new event: add an entry below with its colours and wording (or its own
template for a different layout). It then appears in the admin event form's "Ticket email design"
dropdown. Events without a design of their own use "standard".
"""
import re
import uuid
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.conf import settings
from django.template.loader import render_to_string

from .models import Event, EventRegistration, TicketType

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


CUSTOM_EMAIL_DESIGN = "custom"
HEX_COLOUR = re.compile(r"^#[0-9a-fA-F]{6}$")
CUSTOM_TEXT_LIMIT = 200


def email_design_choices() -> list[dict]:
    choices = [{"value": key, "label": design["label"]} for key, design in EMAIL_DESIGNS.items()]
    return choices + [{"value": CUSTOM_EMAIL_DESIGN, "label": "Custom (choose colours and wording)"}]


def validate_custom_design(value) -> dict:
    """Cleans Event.email_custom. Colours end up inside style attributes, so only #RRGGBB is allowed."""
    if not isinstance(value, dict):
        raise ValueError("Custom design must be an object.")
    cleaned = {}
    mode = value.get("mode", "light")
    if mode not in ("light", "dark"):
        raise ValueError("mode must be light or dark.")
    cleaned["mode"] = mode
    for key in ("accent", "highlight"):
        colour = str(value.get(key) or "").strip()
        if colour and not HEX_COLOUR.match(colour):
            raise ValueError(f"{key} must be a colour like #c8102e.")
        if colour:
            cleaned[key] = colour.lower()
    for key in ("greeting", "note"):
        text = str(value.get(key) or "").strip()
        if len(text) > CUSTOM_TEXT_LIMIT:
            raise ValueError(f"{key} must be at most {CUSTOM_TEXT_LIMIT} characters.")
        if text:
            cleaned[key] = text
    return cleaned


def _readable_on(colour: str) -> str:
    """Black or white text, whichever reads better on `colour`."""
    r, g, b = (int(colour[i:i + 2], 16) / 255 for i in (1, 3, 5))
    luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return "#141414" if luminance > 0.55 else "#ffffff"


def _custom_design(options: dict) -> dict:
    base = EMAIL_DESIGNS["movie_night" if options.get("mode") == "dark" else "standard"]
    accent = options.get("accent") or base["theme"]["accent"]
    highlight = options.get("highlight") or base["theme"]["highlight_bg"]
    theme = {
        **base["theme"],
        "accent": accent,
        "eyebrow": accent if options.get("mode") != "dark" else base["theme"]["eyebrow"],
        "highlight_bg": highlight, "highlight_text": _readable_on(highlight),
        "button_bg": highlight, "button_text": _readable_on(highlight),
    }
    if options.get("mode") == "dark":
        # Neutral dark greys, not Movie Night's red-tinted ones, so any chosen colour sits well on it.
        theme.update({
            "page_bg": "#0d0f12", "card_bg": "#16191f", "card_border": "#262a33",
            "body": "#cfd3da", "muted": "#9aa0aa", "faint": "#6b717c", "divider": "#2c313a",
        })
        # The eyebrow follows the chosen colour when it's light enough to read on the dark card.
        theme["eyebrow"] = accent if _readable_on(accent) == "#141414" else highlight
    return {
        "label": "Custom",
        "template": "events/emails/ticket.html",
        "greeting": options.get("greeting") or "you're in. We've saved you a spot.",
        "doors_tip": base["doors_tip"] if options.get("mode") != "dark" else "Doors open at {time} WAT. Please arrive on time.",
        "note": options.get("note", ""),
        "theme": theme,
    }


def _naira(kobo: int) -> str:
    naira = kobo / 100
    return f"₦{naira:,.0f}" if naira == int(naira) else f"₦{naira:,.2f}"


def _clock(moment) -> str:
    # "6:00 PM", without a leading zero (strftime's %-I isn't available on Windows).
    return moment.strftime("%I:%M %p").lstrip("0")


def _design(event) -> dict:
    if event.email_design == CUSTOM_EMAIL_DESIGN:
        return _custom_design(event.email_custom or {})
    return EMAIL_DESIGNS.get(event.email_design) or EMAIL_DESIGNS[DEFAULT_EMAIL_DESIGN]


def ticket_email_context(registration: EventRegistration, ticket_types: list | None = None) -> dict:
    """ticket_types: the event's types, passed in for previews of events that aren't saved yet."""
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
    types = ticket_types if ticket_types is not None else list(event.ticket_types.all())
    venues = {t.name: t.effective_venue for t in types}
    if len(types) > 1 and len(set(venues.values())) > 1:
        tips.append(" ".join(f"{name} is in {place}." for name, place in venues.items()))
    tips.append("If the QR code won't scan at the gate, give them your ticket code instead.")
    if design.get("note"):
        tips.append(design["note"])

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


def render_ticket_email(registration: EventRegistration, ticket_types: list | None = None) -> tuple[str, str, str]:
    """(subject, plain text, html) for a confirmed ticket, in the event's chosen design."""
    context = ticket_email_context(registration, ticket_types)
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


def render_preview(data: dict) -> str:
    """
    HTML of the ticket email for the admin form's "Preview email", from the form's current (possibly
    unsaved) values and a sample buyer. Nothing is saved.
    """
    from django.utils.dateparse import parse_datetime
    from django.utils import timezone

    start = parse_datetime(str(data.get("start_time") or "")) or timezone.now()
    if timezone.is_naive(start):
        start = timezone.make_aware(start, LAGOS)
    end = parse_datetime(str(data.get("end_time") or "")) if data.get("end_time") else None
    if end and timezone.is_naive(end):
        end = timezone.make_aware(end, LAGOS)

    event = Event(
        title=str(data.get("title") or "Your Event Title")[:255],
        start_time=start,
        end_time=end,
        location=str(data.get("location") or "Venue to be announced")[:500],
        is_remote=bool(data.get("is_remote")),
        poster_url=str(data.get("poster_url") or "") if str(data.get("poster_url") or "").startswith("https://") else "",
        email_design=str(data.get("email_design") or DEFAULT_EMAIL_DESIGN),
        email_custom=validate_custom_design(data.get("email_custom") or {}),
    )
    types = []
    for order, item in enumerate((data.get("ticket_types") or [])[:10]):
        try:
            price = Decimal(str(item.get("price") or 0))
        except Exception:
            price = Decimal(0)
        types.append(TicketType(
            event=event, name=str(item.get("name") or "Regular")[:60], price=max(price, Decimal(0)),
            venue=str(item.get("venue") or "")[:500], sort_order=order,
        ))
    first = types[0] if types else None
    sample = EventRegistration(
        event=event, ticket_type=first, name="Ada Example", email="ada@example.com",
        short_code="K7QF-3M2P", token=uuid.UUID(int=0), status=EventRegistration.Status.CONFIRMED,
        amount_kobo=first.price_kobo if first else 0,
    )
    return render_ticket_email(sample, ticket_types=types)[2]
