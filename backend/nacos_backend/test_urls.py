"""
Minimal urlconf used only by accounts.tests.AdminErrorEmailTest to verify
that an unhandled exception actually reaches Django's AdminEmailHandler.
Not included in the real ROOT_URLCONF.
"""
from django.urls import path


def broken_view(request):
    raise ValueError("Deliberate test crash to verify admin email alert")


urlpatterns = [
    path("__test_crash__/", broken_view),
]
