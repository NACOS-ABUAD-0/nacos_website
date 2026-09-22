# backend/committees/migrations/0003_remove_electoral_disciplinary_committees.py
#
# The Electoral and Disciplinary committees were dropped from the app-startup
# seed list (see committees/apps.py), but that only stops them being
# re-created — it doesn't remove rows a previous run already seeded (e.g. on
# Render). This data migration deletes those two committees, along with any
# applications submitted to them (Committee -> CommitteeApplication is
# on_delete=CASCADE).

from django.db import migrations


REMOVED_COMMITTEES = [
    "NACOS Electoral Committee",
    "NACOS Disciplinary Committee",
]


def remove_committees(apps, schema_editor):
    Committee = apps.get_model('committees', 'Committee')
    Committee.objects.filter(name__in=REMOVED_COMMITTEES).delete()


def noop_reverse(apps, schema_editor):
    # Not reversible: apps.py re-seeds committees on next app start anyway.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('committees', '0002_committee_leader'),
    ]

    operations = [
        migrations.RunPython(remove_committees, noop_reverse),
    ]
