from django.db import models
from accounts.models import User


class FaceEmbedding(models.Model):
    """
    Stores a single face embedding vector for a user.
    Raw images are NEVER stored — only the numeric embedding.
    Multiple embeddings per user improve match accuracy.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="face_embeddings",
    )
    # Facenet produces 128-dim vectors; stored as a JSON array of floats.
    embedding = models.JSONField(
        help_text="128-dimensional float vector extracted by Facenet."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "face_auth_embedding"
        ordering = ["-created_at"]
        verbose_name = "Face Embedding"
        verbose_name_plural = "Face Embeddings"

    def __str__(self) -> str:
        return f"FaceEmbedding({self.user.email}, id={self.pk})"