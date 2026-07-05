from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsAdmin
from attendance.models import ClassAttendance, ClassSession
from committees.models import Committee, CommitteeApplication
from events.models import Event, EventRegistration
from executives.models import Executive
from gallery.models import GalleryImage
from inquiries.models import Inquiry
from projects.models import Project, SkillTag
from resources.models import Resource


class AdminStatsView(APIView):
    """
    GET /api/admin/stats/
    Real, live cross-app counts for the admin Metrics dashboard (and the
    admin Home page's usePublicStats hook, which has been silently 404ing
    on this exact URL until now).
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response({
            "students": User.objects.filter(role=User.Role.USER).count(),
            "projects": Project.objects.count(),
            "skills": SkillTag.objects.count(),
            "events": Event.objects.count(),
            "resources": Resource.objects.count(),
            "committees": Committee.objects.count(),
            "committee_applications": CommitteeApplication.objects.count(),
            "gallery_images": GalleryImage.objects.count(),
            "inquiries": Inquiry.objects.count(),
            "event_registrations": EventRegistration.objects.count(),
            "class_sessions": ClassSession.objects.count(),
            "class_attendances": ClassAttendance.objects.count(),
            "executives": Executive.objects.count(),
        })
