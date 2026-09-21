from django.db import migrations


class Migration(migrations.Migration):
    """
    The face_auth app has been removed. Its FaceEmbedding table has a FK to
    accounts_user, so if it were left behind, deleting a user who had enrolled
    a face would fail with an IntegrityError (Django no longer knows to
    cascade into it). IF EXISTS keeps this a no-op on databases where the
    table was never created.
    """

    dependencies = [
        ("accounts", "0006_devicetoken"),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS face_auth_embedding;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
