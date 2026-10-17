
from django.contrib import admin
from django.urls import path, include

from tasks.auth_views import (
    CSRFTokenView,
    CookieLoginView,
    CookieRefreshView,
    CookieLogoutView,
    CurrentUserView,
)
from django.http import JsonResponse

def healthz(request):
    return JsonResponse({"status": "ok"})
urlpatterns = [
    path("healthz", healthz, name="healthz"),
    path("admin/", admin.site.urls),

    # CSRF protection
    path("api/v5/csrf/", CSRFTokenView.as_view(), name="csrf_token"),

    # Cookie-based JWT authentication
    path("api/v5/token/", CookieLoginView.as_view(), name="token_obtain_pair"),
    path("api/v5/token/refresh/", CookieRefreshView.as_view(), name="token_refresh"),
    path("api/v5/logout/", CookieLogoutView.as_view(), name="logout"),
    path("api/v5/auth/me/", CurrentUserView.as_view(), name="current_user"),

    # Main API
    path("api/v5/", include("tasks.urls")),
]
