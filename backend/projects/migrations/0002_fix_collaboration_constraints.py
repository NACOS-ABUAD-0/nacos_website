# path: backend/projects/migrations/0002_fix_collaboration_constraints.py
#
# IMPORTANT: Verify that the `dependencies` entry below matches the name of
# YOUR actual last migration in this app. Adjust the string if needed.
# Run:  python manage.py showmigrations projects
#
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
    ]

    operations = [
        # ── Fix 1: Change need FK from CASCADE → SET_NULL ─────────────────────
        # Prevents collaboration requests from being silently wiped when
        # a project's needs are rebuilt during an update.
        migrations.AlterField(
            model_name='collaborationrequest',
            name='need',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='requests',
                to='projects.collaborationneed',
            ),
        ),

        # ── Fix 2: Correct the unique_together constraint ─────────────────────
        # Root cause of Bug 1 and Bug 4:
        # If the DB has unique_together=('applicant',), a user can only ever
        # submit ONE collaboration request across ALL projects — applying to a
        # second project raises IntegrityError / "already applied" response.
        # Setting it to ('project', 'applicant') allows one request per project.
        migrations.AlterUniqueTogether(
            name='collaborationrequest',
            unique_together={('project', 'applicant')},
        ),
    ]