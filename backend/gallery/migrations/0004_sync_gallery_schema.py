# Sync gallery_galleryimage with the current model on legacy production DBs.

from django.db import migrations, models


def _table_columns(schema_editor, table_name):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        return {
            col.name
            for col in connection.introspection.get_table_description(cursor, table_name)
        }


def _add_column_postgres(cursor, name, definition):
    cursor.execute(
        f"ALTER TABLE gallery_galleryimage "
        f"ADD COLUMN IF NOT EXISTS {name} {definition}"
    )


def sync_gallery_schema(apps, schema_editor):
    table = "gallery_galleryimage"
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        if table not in connection.introspection.table_names(cursor):
            return

    # (column_name, PostgreSQL column definition)
    required = [
        ("image_url", "varchar(2048) NOT NULL DEFAULT ''"),
        ("caption", "varchar(255) NOT NULL DEFAULT ''"),
        ("alt_text", "varchar(255) NOT NULL DEFAULT ''"),
        ("category", "varchar(50) NOT NULL DEFAULT 'Others'"),
        ("display_order", "integer NOT NULL DEFAULT 0"),
        ("is_published", "boolean NOT NULL DEFAULT true"),
        ("created_at", "timestamp with time zone NOT NULL DEFAULT NOW()"),
        ("updated_at", "timestamp with time zone NOT NULL DEFAULT NOW()"),
    ]

    columns = _table_columns(schema_editor, table)

    with connection.cursor() as cursor:
        if connection.vendor == "postgresql":
            for name, definition in required:
                if name not in columns:
                    _add_column_postgres(cursor, name, definition)

            columns = _table_columns(schema_editor, table)
            if "image" in columns:
                cursor.execute(
                    "ALTER TABLE gallery_galleryimage DROP COLUMN IF EXISTS image"
                )
        else:
            # SQLite — ADD COLUMN without IF NOT EXISTS
            for name, definition in required:
                if name not in columns:
                    simple = definition.split(" NOT NULL")[0]
                    default = ""
                    if "DEFAULT" in definition:
                        default = " DEFAULT " + definition.split("DEFAULT", 1)[1].strip()
                    cursor.execute(
                        f"ALTER TABLE gallery_galleryimage "
                        f"ADD COLUMN {name} {simple}{default}"
                    )
                    columns = _table_columns(schema_editor, table)


class Migration(migrations.Migration):

    dependencies = [
        ("gallery", "0003_gallery_image_url_fixup"),
    ]

    operations = [
        migrations.RunPython(sync_gallery_schema, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="galleryimage",
            name="image_url",
            field=models.URLField(blank=True, max_length=2048),
        ),
    ]
