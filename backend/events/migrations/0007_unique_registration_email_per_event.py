from django.db import migrations, models


class Migration(migrations.Migration):
    """Separate from 0006 so the data copy and the new constraint don't share a transaction."""

    dependencies = [
        ('events', '0006_event_audience_guest_registrations'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='eventregistration',
            constraint=models.UniqueConstraint(fields=('event', 'email'), name='unique_registration_email_per_event'),
        ),
    ]
