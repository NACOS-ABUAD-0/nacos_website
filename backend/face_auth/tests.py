from django.conf import settings
from django.test import TestCase

from .views import FaceLoginView, FaceRegisterView


class FaceAuthThrottleTest(TestCase):
    """
    Face recognition runs a heavy TensorFlow inference per request (see
    incident notes: this previously spiked EC2 memory enough to stall the
    whole server). These checks just confirm the throttle wiring is in
    place — not the full inference pipeline, which needs deepface/tensorflow
    and a real face image to exercise meaningfully.
    """

    def test_face_login_is_throttled(self):
        self.assertEqual(FaceLoginView.throttle_scope, 'face_auth')

    def test_face_register_is_throttled(self):
        self.assertEqual(FaceRegisterView.throttle_scope, 'face_auth')

    def test_face_auth_throttle_rate_is_configured(self):
        self.assertIn('face_auth', settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])
