from django.db import migrations, models

import executives.models


class Migration(migrations.Migration):

    dependencies = [
        ('executives', '0001_initial'),
    ]

    operations = [
        # Any executives that already exist belong to the first session the
        # site covers. preserve_default=False keeps the default out of the
        # model so every new executive must state its session explicitly.
        migrations.AddField(
            model_name='executive',
            name='session',
            field=models.CharField(
                db_index=True,
                default='25/26',
                help_text='Administration session, e.g. 26/27',
                max_length=5,
                validators=[executives.models.validate_session],
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='executive',
            name='photo_link',
            field=models.CharField(
                blank=True,
                max_length=2048,
                validators=[executives.models.validate_photo_link],
            ),
        ),
        migrations.AddField(
            model_name='executive',
            name='level',
            field=models.CharField(
                blank=True,
                help_text='e.g. Computer Science 400 Level',
                max_length=100,
            ),
        ),
    ]
