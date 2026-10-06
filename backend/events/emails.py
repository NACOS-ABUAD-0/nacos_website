# backend/events/emails.py
"""The ticket confirmation email (design: dark "cinema ticket" layout, events/ticket_email.html)."""
from zoneinfo import ZoneInfo

from django.conf import settings
from django.template.loader import render_to_string

from .models import EventRegistration

# Events happen in Nigeria; the server clock is UTC.
LAGOS = ZoneInfo("Africa/Lagos")


def _naira(kobo: int) -> str:
    naira = kobo / 100
    return f"₦{naira:,.0f}" if naira == int(naira) else f"₦{naira:,.2f}"


def _clock(moment) -> str:
    # "6:00 PM", without a leading zero (strftime's %-I isn't available on Windows).
    return moment.strftime("%I:%M %p").lstrip("0")


def ticket_email_context(registration: EventRegistration) -> dict:
    event = registration.event
    ticket_type = registration.ticket_type
    start = event.start_time.astimezone(LAGOS)
    venue = ticket_type.effective_venue if ticket_type else ("Online" if event.is_remote else event.location)
    holder = registration.name or registration.email

    # "Movie Night" -> "Movie" + highlighted "Night"; one-word titles aren't split.
    words = event.title.split()
    title_start, title_highlight = (" ".join(words[:-1]), words[-1]) if len(words) > 1 else (event.title, "")

    paid = registration.amount_kobo or (ticket_type.price_kobo if ticket_type else 0)

    tips = [f"Doors open at {_clock(start)} WAT. Come early for the best seats."]
    if event.end_time:
        tips[0] = f"Doors open at {_clock(start)} WAT and it runs until {_clock(event.end_time.astimezone(LAGOS))}."
    tips.append("Your code is single-use, so don't share a screenshot of it.")
    # Spell out where each ticket type goes when they're in different places.
    types = list(event.ticket_types.all())
    venues = {t.name: t.effective_venue for t in types}
    if len(types) > 1 and len(set(venues.values())) > 1:
        tips.append(" ".join(f"{name} is in {place}." for name, place in venues.items()))
    tips.append("If the QR code won't scan at the gate, give them your ticket code instead.")

    return {
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
    """(subject, plain text, html) for a confirmed ticket."""
    context = ticket_email_context(registration)
    subject = f"Your {context['type_name']} ticket: {registration.event.title}"
    text = "\n".join([
        f"Hi {context['first_name']}, you're in. Your {context['type_name']} ticket for {registration.event.title} is confirmed.",
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
    return subject, text, render_to_string("events/ticket_email.html", context)
