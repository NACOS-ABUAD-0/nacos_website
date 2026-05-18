# Repairs production DBs where gallery_galleryimage exists but image_url is missing,
# and widens image_url for long CDN links (e.g. Wikimedia).

from django.db import migrations, models


def _table_columns(schema_editor, table_name):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        return {
            col.name
            for col in connection.introspection.get_table_description(cursor, table_name)
        }


def ensure_gallery_schema(apps, schema_editor):
    table = "gallery_galleryimage"
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        if table not in connection.introspection.table_names(cursor):
            return

    columns = _table_columns(schema_editor, table)

    with connection.cursor() as cursor:
        if "image_url" not in columns:
            if connection.vendor == "postgresql":
                cursor.execute(
                    "ALTER TABLE gallery_galleryimage "
                    "ADD COLUMN IF NOT EXISTS image_url varchar(2048) NOT NULL DEFAULT ''"
                )
            else:
                cursor.execute(
                    "ALTER TABLE gallery_galleryimage "
                    "ADD COLUMN image_url varchar(2048) NOT NULL DEFAULT ''"
                )

        columns = _table_columns(schema_editor, table)
        if "image" in columns and connection.vendor == "postgresql":
            cursor.execute(
                "ALTER TABLE gallery_galleryimage DROP COLUMN IF EXISTS image"
            )


class Migration(migrations.Migration):

    dependencies = [
        ("gallery", "0002_remove_galleryimage_image"),
    ]

    operations = [
        migrations.RunPython(ensure_gallery_schema, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="galleryimage",
            name="image_url",
            field=models.URLField(blank=True, max_length=2048),
        ),
    ]
