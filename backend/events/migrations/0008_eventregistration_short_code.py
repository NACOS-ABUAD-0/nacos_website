from django.db import migrations, models


def backfill_short_codes(apps, schema_editor):
    from events.models import generate_short_code

    EventRegistration = apps.get_model('events', 'EventRegistration')
    used = set()
    for registration in EventRegistration.objects.filter(short_code__isnull=True).only('pk'):
        code = generate_short_code()
        while code in used:
            code = generate_short_code()
        used.add(code)
        EventRegistration.objects.filter(pk=registration.pk).update(short_code=code)


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0007_unique_registration_email_per_event'),
    ]

    operations = [
        migrations.AddField(
            model_name='eventregistration',
            name='short_code',
            field=models.CharField(max_length=9, null=True, editable=False),
        ),
        migrations.RunPython(backfill_short_codes, migrations.RunPython.noop),
    ]
