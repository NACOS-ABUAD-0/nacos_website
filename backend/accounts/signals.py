# backend/accounts/signals.py
import logging

import requests
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


@receiver(post_save, sender=Notification)
def send_push_on_notification_created(sender, instance: Notification, created: bool, **kwargs):
    """
    Fires an Expo push notification to every device registered for this
    user whenever a new Notification row is created. Single choke point —
    every existing Notification.objects.create(...) call site (committees,
    projects/collaboration) automatically gets mobile push for free, and
    any future one will too, without needing to remember to wire it in.

    Best-effort only: push failures are logged and swallowed, never raised,
    matching the defensive pattern already used for Gemini calls in
    assistant/services.py — a broken push service must never break the
    underlying action (e.g. accepting a collaboration request).
    """
    if not created:
        return

    tokens = list(instance.user.device_tokens.values_list('token', flat=True))
    if not tokens:
        return

    try:
        requests.post(
            EXPO_PUSH_URL,
            json=[
                {
                    "to": token,
                    "title": instance.title,
                    "body": instance.message,
                    "data": instance.data,
                }
                for token in tokens
            ],
            headers={"Content-Type": "application/json"},
            timeout=5,
        )
    except Exception:
        logger.warning("Failed to send push notification for Notification id=%s", instance.pk, exc_info=True)
