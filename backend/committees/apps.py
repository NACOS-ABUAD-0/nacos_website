# backend/committees/apps.py
from django.apps import AppConfig
from django.db import connection


class CommitteesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'committees'

    def ready(self):
        # Only seed if the table actually exists (prevents crash on migrate)
        from .models import Committee

        if 'committees_committee' not in connection.introspection.table_names():
            return

        committees = [
            {
                "name": "NACOS Dev Team",
                "description": "Build and maintain NACOS technical infrastructure, websites, and internal tools.",
            },
            {
                "name": "Academic Committee",
                "description": "Organize tutorials, study groups, and academic support programs for computing students.",
            },
            {
                "name": "Social Committee",
                "description": "Plan and execute social events, hangouts, and community bonding activities.",
            },
            {
                "name": "Editorial Team",
                "description": "Manage content creation, newsletters, blogs, and official NACOS publications.",
            },
            {
                "name": "Public Relations Committee",
                "description": "Handle external communications, partnerships, and brand representation for NACOS.",
            },
            {
                "name": "Sports Committee",
                "description": "Organize sporting activities, fitness programs, and inter-departmental competitions.",
            },
        ]
        for c in committees:
            Committee.objects.get_or_create(
                name=c["name"],
                defaults={"description": c["description"]}
            )