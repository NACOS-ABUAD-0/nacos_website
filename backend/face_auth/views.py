import logging

from django.contrib.auth import login
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from accounts.serializers import ProfileSerializer

from .face_utils import (
    MAX_EMBEDDINGS_PER_USER,
    compare_face_to_stored,
    extract_embedding,
)
from .models import FaceEmbedding
from .serializers import FaceLoginSerializer, FaceRegisterSerializer

logger = logging.getLogger(__name__)


class FaceRegisterView(APIView):
    """
    POST /api/face-auth/register/
    Authenticated. Enroll 1–5 face images.

    Body: { "images": ["data:image/jpeg;base64,...", ...] }

    Stores only embeddings — raw images discarded immediately.
    Old embeddings are pruned when the cap is reached (oldest-first).
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = FaceRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        images: list[str] = serializer.validated_data["images"]
        user: User = request.user

        new_embeddings: list[list[float]] = []
        extraction_errors: list[str] = []

        for idx, b64 in enumerate(images):
            try:
                emb = extract_embedding(b64)
                new_embeddings.append(emb)
            except (ValueError, RuntimeError) as exc:
                extraction_errors.append(f"Image {idx + 1}: {exc}")
                logger.warning(
                    "Enrollment extraction failed for user %s, image %d: %s",
                    user.email, idx + 1, exc,
                )

        if not new_embeddings:
            return Response(
                {
                    "error": "Could not extract a valid face from any submitted image.",
                    "details": extraction_errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Enforce cap: evict oldest to make room ─────────────────────────
        existing_qs = FaceEmbedding.objects.filter(user=user).order_by("created_at")
        existing_count = existing_qs.count()
        slots_needed = len(new_embeddings)
        overflow = existing_count + slots_needed - MAX_EMBEDDINGS_PER_USER

        if overflow > 0:
            ids_to_delete = list(existing_qs.values_list("id", flat=True)[:overflow])
            FaceEmbedding.objects.filter(id__in=ids_to_delete).delete()

        for emb in new_embeddings:
            FaceEmbedding.objects.create(user=user, embedding=emb)

        # ── Enable face login on the user account ──────────────────────────
        user.face_login_enabled = True
        user.save(update_fields=["face_login_enabled"])

        enrolled_count = FaceEmbedding.objects.filter(user=user).count()
        response_data = {
            "message": f"Successfully enrolled {len(new_embeddings)} face embedding(s).",
            "embeddings_stored": enrolled_count,
            "face_login_enabled": True,
        }
        if extraction_errors:
            response_data["warnings"] = extraction_errors

        return Response(response_data, status=status.HTTP_201_CREATED)


class FaceLoginView(APIView):
    """
    POST /api/face-auth/login/
    Public. Authenticate by face + email.

    Body: { "email": "...", "image": "data:image/jpeg;base64,..." }

    Requires the account to have face_login_enabled=True and at least
    one stored embedding. Falls back gracefully if either is missing.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = FaceLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email: str = serializer.validated_data["email"]
        image_b64: str = serializer.validated_data["image"]

        # ── Resolve user ───────────────────────────────────────────────────
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"error": "No account found with this email address."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not user.is_active:
            return Response(
                {"error": "This account has been deactivated."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not getattr(user, "face_login_enabled", False):
            return Response(
                {
                    "error": "Face login is not enabled for this account. "
                             "Please use email + password, or enable face login from your profile."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        stored_embeddings: list[list[float]] = list(
            FaceEmbedding.objects.filter(user=user).values_list("embedding", flat=True)
        )
        if not stored_embeddings:
            return Response(
                {
                    "error": "No face data found. "
                             "Please re-enroll your face from the Profile page."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Extract embedding from submitted image ─────────────────────────
        try:
            new_embedding = extract_embedding(image_b64)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as exc:
            logger.error("Face extraction error (login) for %s: %s", email, exc)
            return Response(
                {
                    "error": "Face analysis failed. "
                             "Please try again or use password login."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ── Compare ────────────────────────────────────────────────────────
        result = compare_face_to_stored(new_embedding, stored_embeddings)

        if not result["match"]:
            logger.warning(
                "Face login FAILED for %s — confidence=%.4f",
                email, result["confidence"],
            )
            return Response(
                {
                    "error": "Face did not match. Please try again or use password login.",
                    "confidence": result["confidence"],
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # ── Issue JWT tokens ───────────────────────────────────────────────
        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        refresh = RefreshToken.for_user(user)

        logger.info(
            "Face login SUCCESS for %s — confidence=%.4f", email, result["confidence"]
        )

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": ProfileSerializer(user).data,
                "confidence": result["confidence"],
            }
        )


class FaceStatusView(APIView):
    """
    GET /api/face-auth/status/
    Authenticated. Returns face-login status and enrollment count.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user: User = request.user
        count = FaceEmbedding.objects.filter(user=user).count()
        return Response(
            {
                "face_login_enabled": getattr(user, "face_login_enabled", False),
                "embeddings_count": count,
                "max_embeddings": MAX_EMBEDDINGS_PER_USER,
            }
        )


class FaceDeleteView(APIView):
    """
    DELETE /api/face-auth/delete/
    Authenticated. Removes ALL face embeddings and disables face login.
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user: User = request.user
        deleted_count, _ = FaceEmbedding.objects.filter(user=user).delete()

        user.face_login_enabled = False
        user.save(update_fields=["face_login_enabled"])

        logger.info("Face login disabled for %s (%d embedding(s) removed).", user.email, deleted_count)

        return Response(
            {
                "message": f"Face login disabled. {deleted_count} embedding(s) deleted.",
                "face_login_enabled": False,
                "embeddings_count": 0,
            }
        )