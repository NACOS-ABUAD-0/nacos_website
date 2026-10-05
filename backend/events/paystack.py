# backend/events/paystack.py
"""Paystack client. Docs: https://paystack.com/docs/api/

Test and live mode are picked by the key itself: sk_test_... or sk_live_...
"""
import hashlib
import hmac

import requests
from django.conf import settings

PAYSTACK_BASE_URL = "https://api.paystack.co"


class PaystackError(Exception):
    def __init__(self, message, status=None, body=None):
        super().__init__(message)
        self.status = status
        self.body = body


def _secret_key() -> str:
    key = settings.PAYSTACK_SECRET_KEY
    if not key:
        raise PaystackError("PAYSTACK_SECRET_KEY is not configured")
    return key


def _request(method: str, path: str, json=None) -> dict:
    try:
        response = requests.request(
            method,
            f"{PAYSTACK_BASE_URL}{path}",
            json=json,
            headers={"Authorization": f"Bearer {_secret_key()}"},
            timeout=15,
        )
    except requests.RequestException as exc:
        raise PaystackError(f"Could not reach Paystack: {exc}") from exc

    try:
        body = response.json()
    except ValueError:
        body = None
    if not response.ok or not (body or {}).get("status"):
        message = (body or {}).get("message") or f"Paystack request failed with HTTP {response.status_code}"
        raise PaystackError(message, status=response.status_code, body=body)
    return body["data"]


def initialize_payment(*, amount_kobo: int, email: str, reference: str, callback_url: str, metadata: dict) -> dict:
    """Returns { authorization_url, access_code, reference }."""
    return _request("POST", "/transaction/initialize", json={
        "amount": amount_kobo,
        "email": email,
        "currency": "NGN",
        "reference": reference,
        "callback_url": callback_url,
        "metadata": metadata,
    })


def verify_payment(reference: str) -> dict:
    """Returns { status: "success" | "failed" | "abandoned" | "ongoing" | ..., amount, currency, fees, id, ... }."""
    return _request("GET", f"/transaction/verify/{requests.utils.quote(reference, safe='')}")


def is_valid_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    """Paystack signs webhooks with HMAC-SHA512 of the raw body using the secret key, in x-paystack-signature."""
    if not raw_body or not signature or not settings.PAYSTACK_SECRET_KEY:
        return False
    expected = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(expected, signature.strip().lower())
