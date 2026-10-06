import events.models
from django.db import migrations, models


class Migration(migrations.Migration):
    """Separate from 0008 so the backfill and the unique index don't share a transaction."""

    dependencies = [
        ('events', '0008_eventregistration_short_code'),
    ]

    operations = [
        migrations.AlterField(
            model_name='eventregistration',
            name='short_code',
            field=models.CharField(default=events.models.generate_short_code, editable=False, max_length=9, unique=True),
        ),
    ]
