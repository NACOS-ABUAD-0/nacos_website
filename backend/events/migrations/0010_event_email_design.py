from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0009_alter_eventregistration_short_code'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='email_design',
            field=models.CharField(default='standard', max_length=40),
        ),
    ]
