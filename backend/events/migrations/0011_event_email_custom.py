from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0010_event_email_design'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='email_custom',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
