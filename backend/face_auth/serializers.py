from rest_framework import serializers


class FaceRegisterSerializer(serializers.Serializer):
    """
    Payload for face enrollment.
    Accepts 1–5 base64-encoded images captured from the browser camera.
    """

    images = serializers.ListField(
        child=serializers.CharField(max_length=2_000_000),
        min_length=1,
        max_length=5,
        help_text="List of base64 image strings (data URLs accepted).",
    )

    def validate_images(self, images: list[str]) -> list[str]:
        for idx, img in enumerate(images):
            if not img or len(img) < 200:
                raise serializers.ValidationError(
                    f"Image {idx + 1} appears to be invalid or empty."
                )
        return images


class FaceLoginSerializer(serializers.Serializer):
    """Payload for face-based login."""

    email = serializers.EmailField()
    image = serializers.CharField(
        max_length=2_000_000,
        help_text="Single base64 image string captured from the browser camera.",
    )

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_image(self, value: str) -> str:
        if not value or len(value) < 200:
            raise serializers.ValidationError("Invalid or empty image data.")
        return value