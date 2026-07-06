# backend/committees/apps.py
import logging

from django.apps import AppConfig
from django.db import connection

logger = logging.getLogger(__name__)


class CommitteesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'committees'

    def ready(self):
        # Only seed if the table actually exists (prevents crash on migrate)
        from .models import Committee

        if 'committees_committee' not in connection.introspection.table_names():
            return

        # Per NACOS ABUAD's constitution, plus the Dev Team (not in the
        # constitution, but works alongside the Software Director to build
        # and maintain NACOS software).
        committees = [
            {
                "name": "NACOS Dev Team",
                "description": (
                    "Works alongside the Software Director to build and maintain "
                    "NACOS ABUAD's software and technical infrastructure, including "
                    "this website."
                ),
            },
            {
                "name": "NACOS Electoral Committee",
                "description": (
                    "Conducts free, fair, and credible elections for NACOS ABUAD and "
                    "presents the winning candidates. Does not form part of the "
                    "Executive Council and does not attend Executive meetings. "
                    "Releases results immediately after counting."
                ),
            },
            {
                "name": "NACOS Social Committee",
                "description": (
                    "Chaired by the Social Director. Organizes the Association's "
                    "social activities — including NACOS WEEK — with the approval "
                    "of the Executive Council, to whom it is answerable."
                ),
            },
            {
                "name": "NACOS Disciplinary Committee",
                "description": (
                    "Chaired by the Chief of Staff. Handles disciplinary matters, "
                    "investigates conduct issues, and submits reports and "
                    "recommendations — including suspension or expulsion — to the "
                    "Executive Council, to whom it is answerable."
                ),
            },
            {
                "name": "NACOS Editorial Committee",
                "description": (
                    "Responsible for collecting, editing, and preparing articles and "
                    "publications for the Association. Consists of the "
                    "Editor-in-Chief, Assistant Editor-in-Chief, Secretary, and "
                    "members appointed by the Executive Council, to whom it is "
                    "answerable."
                ),
            },
            {
                "name": "NACOS Educational Committee",
                "description": (
                    "Supports the academic and educational development of NACOS "
                    "ABUAD members."
                ),
            },
            {
                "name": "NACOS Welfare Committee",
                "description": (
                    "Chaired by the Welfare Director. Looks after the welfare of "
                    "members and organizes health programmes, reporting to the "
                    "Executive Council through the Welfare Director."
                ),
            },
            {
                "name": "NACOS Past Executive",
                "description": (
                    "Made up of the President and Vice President of past executive "
                    "councils. Serves as an advisory board supporting the smooth "
                    "running of the current Association."
                ),
            },
        ]

        # Defensive: this runs on EVERY management command (including
        # makemigrations, before a new migration for this app has been
        # applied), so a schema mismatch here must never crash the whole
        # process — just skip seeding for that run.
        try:
            for c in committees:
                Committee.objects.get_or_create(
                    name=c["name"],
                    defaults={"description": c["description"]},
                )
        except Exception:
            logger.warning("Committee seed skipped (schema not ready yet).", exc_info=True)
