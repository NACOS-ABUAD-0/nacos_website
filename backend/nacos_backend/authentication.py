from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class OptionalJWTAuthentication(JWTAuthentication):
    """
    Identical to JWTAuthentication except that an invalid or expired token
    returns None (unauthenticated) instead of raising a 401.

    This allows AllowAny views to remain publicly accessible even when the
    client accidentally sends a stale Bearer token.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError):
            return None