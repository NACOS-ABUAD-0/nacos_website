from django.db import migrations

# Same allow-list as events.ticketing.safe_gateway_payload, copied so this migration never changes
# meaning if that function does.
KEEP = {"id", "status", "reference", "amount", "currency", "fees", "paid_at", "created_at", "channel", "gateway_response", "message"}


def scrub(apps, schema_editor):
    """Older payment rows stored Paystack's full response, including card details and the reusable
    authorization code. Keep only what reconciliation needs."""
    TicketPayment = apps.get_model('events', 'TicketPayment')
    for payment in TicketPayment.objects.exclude(gateway_payload=None).only('pk', 'gateway_payload'):
        payload = payment.gateway_payload
        if isinstance(payload, dict):
            cleaned = {key: value for key, value in payload.items() if key in KEEP}
            if cleaned != payload:
                TicketPayment.objects.filter(pk=payment.pk).update(gateway_payload=cleaned)


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0012_payment_safety'),
    ]

    operations = [
        migrations.RunPython(scrub, migrations.RunPython.noop),
    ]
