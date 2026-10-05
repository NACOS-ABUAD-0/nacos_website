import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def copy_holder_from_account(apps, schema_editor):
    """Existing registrations all belong to accounts; copy the name and email onto the ticket."""
    EventRegistration = apps.get_model('events', 'EventRegistration')
    for registration in EventRegistration.objects.select_related('user').filter(user__isnull=False):
        registration.name = registration.user.full_name
        registration.email = registration.user.email.strip().lower()
        registration.save(update_fields=['name', 'email'])


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0005_ticket_type_venue'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='audience',
            field=models.CharField(
                choices=[('nacos_only', 'NACOS members only'), ('public', 'Open to everyone')],
                default='nacos_only', max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='eventregistration',
            name='user',
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                related_name='event_registrations', to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='eventregistration',
            name='name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='eventregistration',
            name='email',
            field=models.EmailField(blank=True, default='', max_length=254),
        ),
        migrations.RunPython(copy_holder_from_account, migrations.RunPython.noop),
    ]
