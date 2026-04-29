"""
Core face-recognition utilities.

Pipeline:
  base64 image → PIL Image → temp JPEG → DeepFace.represent() → embedding
  embedding vs stored_embeddings → cosine similarity → match / no-match
"""

from __future__ import annotations

import base64
import io
import logging
import os
import tempfile
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────────
MODEL_NAME = "Facenet"          # 128-dim; good speed/accuracy balance
DETECTOR_BACKEND = "opencv"     # fast; no extra deps
FACE_MATCH_THRESHOLD = 0.72     # cosine similarity threshold (0–1)
MAX_EMBEDDINGS_PER_USER = 5


# ── Image helpers ──────────────────────────────────────────────────────────────

def decode_base64_image(b64_string: str):
    """
    Decode a data URL or raw base64 string to a PIL RGB Image.
    Handles both 'data:image/jpeg;base64,<data>' and plain base64.
    """
    from PIL import Image  # imported lazily to avoid startup cost

    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]

    raw = base64.b64decode(b64_string)
    return Image.open(io.BytesIO(raw)).convert("RGB")


# ── Embedding extraction ───────────────────────────────────────────────────────

def extract_embedding(b64_image: str) -> list[float]:
    """
    Extract a face embedding from a base64-encoded image.

    Returns:
        list[float] — 128-dimensional embedding vector.

    Raises:
        ValueError  — no face detected, or multiple faces present.
        RuntimeError — DeepFace / OS-level failure.
    """
    from deepface import DeepFace  # lazy import; heavy module

    image = decode_base64_image(b64_image)

    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".jpg")
    try:
        os.close(tmp_fd)
        image.save(tmp_path, format="JPEG", quality=95)

        result: Any = DeepFace.represent(
            img_path=tmp_path,
            model_name=MODEL_NAME,
            enforce_detection=True,
            detector_backend=DETECTOR_BACKEND,
            align=True,
        )

        if isinstance(result, list):
            if len(result) == 0:
                raise ValueError("No face detected in the image. Please ensure your face is clearly visible.")
            if len(result) > 1:
                raise ValueError(
                    f"{len(result)} faces detected. Only your face should be visible in the frame."
                )
            embedding = result[0]["embedding"]
        else:
            embedding = result["embedding"]

        return list(embedding)

    except ValueError:
        raise
    except Exception as exc:
        logger.error("DeepFace extraction error: %s", exc, exc_info=True)
        raise RuntimeError(
            "Face analysis could not be completed. Please try again with better lighting."
        ) from exc
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


# ── Math helpers ───────────────────────────────────────────────────────────────

def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    """Return cosine similarity in [0, 1] (higher = more similar)."""
    a = np.asarray(v1, dtype=np.float64)
    b = np.asarray(v2, dtype=np.float64)
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def compute_average_embedding(embeddings: list[list[float]]) -> list[float]:
    """Compute the element-wise mean of a list of embedding vectors."""
    arr = np.array(embeddings, dtype=np.float64)
    return list(np.mean(arr, axis=0))


# ── Comparison ─────────────────────────────────────────────────────────────────

def compare_face_to_stored(
    new_embedding: list[float],
    stored_embeddings: list[list[float]],
    threshold: float = FACE_MATCH_THRESHOLD,
) -> dict:
    """
    Compare a new embedding against every stored embedding for a user.

    Strategy (both used to reduce false positives):
    - individual_best  — highest pairwise cosine similarity
    - avg_score        — similarity against the mean embedding

    Final confidence: 0.4 × best_individual + 0.6 × avg_score

    Returns dict:
        match      (bool)
        confidence (float 0–1)
        avg_score  (float)
        best_score (float)
        reason     (str, only when match is False)
    """
    if not stored_embeddings:
        return {
            "match": False,
            "confidence": 0.0,
            "avg_score": 0.0,
            "best_score": 0.0,
            "reason": "No face data enrolled for this account.",
        }

    individual_scores = [cosine_similarity(new_embedding, e) for e in stored_embeddings]
    best_score = max(individual_scores)

    avg_embedding = compute_average_embedding(stored_embeddings)
    avg_score = cosine_similarity(new_embedding, avg_embedding)

    confidence = round(0.4 * best_score + 0.6 * avg_score, 4)
    match = confidence >= threshold

    result: dict = {
        "match": match,
        "confidence": confidence,
        "avg_score": round(avg_score, 4),
        "best_score": round(best_score, 4),
    }
    if not match:
        result["reason"] = (
            f"Face did not match (confidence {confidence:.2f} < threshold {threshold})."
        )
    return result