# backend/accounts/urls.py
from django.urls import path
from .views import RegisterView, LoginView, LogoutView, ProfileView, CSRFTokenView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', ProfileView.as_view(), name='profile'),
    path('auth/csrf/', CSRFTokenView.as_view(), name='csrf_token'),

]