
from rest_framework.authentication import (
    BaseAuthentication,
    get_authorization_header,
)
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.middleware.csrf import CsrfViewMiddleware
import logging
from django.conf import settings

logger = logging.getLogger(__name__)
class CSRFCheck(CsrfViewMiddleware):
    def _reject(self, request, reason):
        return reason


def enforce_csrf(request):
    check = CSRFCheck(lambda request: None)
    check.process_request(request)

    reason = check.process_view(
        request,
        None,
        (),
        {},
    )

    if reason:
        logger.warning(
            "CSRF verification failed: reason=%s, "
            "origin=%s, csrf_cookie_present=%s, "
            "csrf_header_present=%s",
            reason,
            request.META.get("HTTP_ORIGIN", "missing"),
            bool(request.COOKIES.get(settings.CSRF_COOKIE_NAME)),
            bool(request.META.get("HTTP_X_CSRFTOKEN")),
        )

        raise PermissionDenied(
            f"CSRF verification failed: {reason}"
        )


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Keep Bearer-token support for Postman and other API clients.
        auth_header = get_authorization_header(request)

        if auth_header:
            return super().authenticate(request)

        # Browser requests authenticate through the HttpOnly cookie.
        raw_token = request.COOKIES.get("access_token")

        if not raw_token:
            return None

        # Cookies are automatically sent by browsers, so protect
        # requests that modify data with CSRF validation.
        if request.method not in (
            "GET",
            "HEAD",
            "OPTIONS",
            "TRACE",
        ):
            enforce_csrf(request._request)

        validated_token = self.get_validated_token(
            raw_token.encode("utf-8")
        )
        user = self.get_user(validated_token)

        return user, validated_token
