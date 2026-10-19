
from datetime import timedelta
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.middleware.csrf import get_token

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)

from .authentication import enforce_csrf


def cookie_options():
    return {
        "httponly": True,
        "secure": not settings.DEBUG,
        "samesite": getattr(
            settings,
            "JWT_COOKIE_SAMESITE",
            "Lax",
        ),
    }


def set_auth_cookies(response, access, refresh=None):
    options = cookie_options()

    access_lifetime = settings.SIMPLE_JWT.get(
        "ACCESS_TOKEN_LIFETIME",
        timedelta(minutes=5),
    )

    response.set_cookie(
        key="access_token",
        value=access,
        max_age=int(access_lifetime.total_seconds()),
        path="/",
        **options,
    )

    if refresh is not None:
        refresh_lifetime = settings.SIMPLE_JWT.get(
            "REFRESH_TOKEN_LIFETIME",
            timedelta(days=1),
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh,
            max_age=int(refresh_lifetime.total_seconds()),
            path="/api/v5/token/refresh/",
            **options,
        )


def clear_auth_cookies(response):
    samesite = getattr(
        settings,
        "JWT_COOKIE_SAMESITE",
        "Lax",
    )

    response.delete_cookie(
        "access_token",
        path="/",
        samesite=samesite,
    )

    response.delete_cookie(
        "refresh_token",
        path="/api/v5/token/refresh/",
        samesite=samesite,
    )


class CSRFTokenView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        csrf_token = get_token(request._request)

        response = Response({
            "csrfToken": csrf_token,
        })

        response.set_cookie(
            key=settings.CSRF_COOKIE_NAME,
            value=request._request.META.get("CSRF_COOKIE"),
            secure=not settings.DEBUG,
            httponly=False,
            samesite=getattr(
                settings,
                "CSRF_COOKIE_SAMESITE",
                "Lax",
            ),
            path="/",
        )

        return response


class CookieLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        enforce_csrf(request._request)

        serializer = TokenObtainPairSerializer(
            data=request.data,
        )

        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        tokens = serializer.validated_data

        response = Response(
            {"detail": "Login successful."},
            status=status.HTTP_200_OK,
        )

        set_auth_cookies(
            response,
            access=tokens["access"],
            refresh=tokens["refresh"],
        )

        return response


class CookieRefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        enforce_csrf(request._request)

        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token is missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(
            data={"refresh": refresh_token},
        )

        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, ValidationError):
            return Response(
                {"detail": "Refresh token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        tokens = serializer.validated_data

        response = Response(
            {"detail": "Session refreshed."},
            status=status.HTTP_200_OK,
        )

        set_auth_cookies(
            response,
            access=tokens["access"],
            refresh=tokens.get("refresh"),
        )

        return response


class CookieLogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        enforce_csrf(request._request)

        response = Response(
            {"detail": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )

        clear_auth_cookies(response)

        return response
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "username": request.user.username,
        })
