from django.urls import path

from .views import FaceDeleteView, FaceLoginView, FaceRegisterView, FaceStatusView

urlpatterns = [
    # Enrollment (authenticated)
    path("register/", FaceRegisterView.as_view(), name="face-register"),
    # Status (authenticated)
    path("status/", FaceStatusView.as_view(), name="face-status"),
    # Disable & delete (authenticated)
    path("delete/", FaceDeleteView.as_view(), name="face-delete"),
    # Login (public)
    path("login/", FaceLoginView.as_view(), name="face-login"),
]