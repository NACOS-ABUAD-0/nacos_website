"""
Finds Paystack payments the database doesn't know about, e.g. after restoring from a backup.

    python manage.py find_missing_payments --since 2026-10-16T02:00:00Z
    python manage.py find_missing_payments --since 2026-10-16T02:00:00Z --settle

Read-only by default. Each successful Paystack transaction since --since lands in one of:
  MISSING     no row for its reference: the checkout happened after the backup. The buyer paid
              but has no ticket; re-issue it in the admin (or refund) using the details printed.
  UNSETTLED   the row exists but isn't marked successful: the payment completed after the backup.
              --settle confirms these through the normal settle_payment path (emails the ticket).
Transactions whose reference doesn't start with NACOS- weren't made by this site and are skipped.
"""
import json

from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime

from events.models import Event, TicketPayment
from events.paystack import PaystackError, list_successful_transactions
from events.ticketing import settle_payment


def _metadata(transaction: dict) -> dict:
    metadata = transaction.get('metadata') or {}
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except ValueError:
            return {}
    return metadata if isinstance(metadata, dict) else {}


class Command(BaseCommand):
    help = "List successful Paystack payments missing from (or not settled in) the database."

    def add_arguments(self, parser):
        parser.add_argument('--since', required=True, help="ISO 8601 start time, e.g. 2026-10-16T02:00:00Z")
        parser.add_argument('--settle', action='store_true', help="Confirm UNSETTLED payments (sends ticket emails).")

    def handle(self, *args, since, settle, **options):
        if parse_datetime(since) is None:
            raise CommandError(f"--since must be an ISO 8601 date-time, got {since!r}")
        try:
            transactions = list_successful_transactions(since)
        except PaystackError as exc:
            raise CommandError(f"Paystack: {exc}") from exc

        ours = [t for t in transactions if str(t.get('reference', '')).startswith('NACOS-')]
        known = {
            p.reference: p
            for p in TicketPayment.objects.filter(reference__in=[t['reference'] for t in ours])
        }
        event_titles = dict(Event.objects.values_list('pk', 'title'))

        missing, unsettled = [], []
        for t in ours:
            payment = known.get(t['reference'])
            if payment is None:
                missing.append(t)
            elif payment.status != TicketPayment.Status.SUCCESSFUL:
                unsettled.append((t, payment))

        self.stdout.write(
            f"{len(transactions)} successful Paystack transactions since {since}; "
            f"{len(ours)} from this site, {len(transactions) - len(ours)} skipped."
        )

        self.stdout.write(self.style.WARNING(f"\nMISSING ({len(missing)}): paid, but no record in this database"))
        for t in missing:
            meta = _metadata(t)
            event_id = meta.get('event_id')
            event = event_titles.get(event_id, 'event not in this database') if event_id else 'unknown event'
            self.stdout.write(
                f"  {t.get('paid_at') or t.get('created_at')}  {t['reference']}\n"
                f"      {(t.get('customer') or {}).get('email', '?')}  NGN {int(t.get('amount') or 0) / 100:,.2f}  "
                f"event #{event_id} ({event})  ticket: {meta.get('ticket_type', '?')}"
            )

        self.stdout.write(self.style.WARNING(f"\nUNSETTLED ({len(unsettled)}): record exists but isn't marked paid"))
        for t, payment in unsettled:
            line = f"  {t['reference']}  {payment.email}  status in DB: {payment.status}"
            if settle:
                try:
                    payment = settle_payment(payment.reference)
                    line += f"  -> {payment.status}"
                    if payment.needs_attention:
                        line += f" (needs attention: {payment.get_needs_attention_display()})"
                except PaystackError as exc:
                    line += f"  -> settle failed: {exc}"
            self.stdout.write(line)
        if unsettled and not settle:
            self.stdout.write("  Run again with --settle to confirm these and email their tickets.")
