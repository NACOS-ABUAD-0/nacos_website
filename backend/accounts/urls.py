# backend/accounts/urls.py
from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, ProfileView, CSRFTokenView,
    VerifyEmailView, ResendVerificationEmailView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', ProfileView.as_view(), name='profile'),
    path('auth/csrf/', CSRFTokenView.as_view(), name='csrf_token'),
    path('auth/verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('auth/resend-verification/', ResendVerificationEmailView.as_view(), name='resend_verification'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

]