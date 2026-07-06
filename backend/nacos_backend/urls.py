"""
URL configuration for nacos_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def api_prefix_no_slash(request):
    """
    Handle GET/POST /api (no trailing slash). Without this, APPEND_SLASH tries to
    redirect POST /api → /api/ and raises RuntimeError. Bots and misconfigured
    clients often hit bare /api.
    """
    return JsonResponse(
        {
            "detail": "Not found. Use paths under /api/ with a trailing slash "
            "(e.g. /api/auth/login/)."
        },
        status=404,
    )


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api', api_prefix_no_slash),
    path('api/', include('accounts.urls')),
    path('api/', include('projects.urls')),
    path('api/', include('resources.urls')),
    path('api/', include('events.urls')),
    path('api/', include('gallery.urls')),
    path('api/', include('executives.urls')),
    path('api/', include('inquiries.urls')),
    path('api/', include('committees.urls')),
    path('api/', include('face_auth.urls')),
    path('api/', include('attendance.urls')),
    path('api/', include('dashboard.urls')),
    path('api/', include('complaints.urls')),
    path('api/', include('assistant.urls')),

]
