import json
from io import StringIO
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from .management.commands.seed_executives import SEED_FILE
from .models import Executive, validate_session


class SessionValidationTest(TestCase):
    def test_accepts_consecutive_years(self):
        for value in ('25/26', '26/27', '99/00'):
            validate_session(value)

    def test_rejects_bad_formats(self):
        for value in ('', '2026/27', '26-27', '26/28', '27/26', 'ab/cd', '26/2'):
            with self.assertRaises(ValidationError, msg=value):
                validate_session(value)


class ExecutiveApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Admin One', password='pass12345', role='admin',
        )
        self.student = User.objects.create_user(
            email='student@example.com', full_name='Student One', password='pass12345',
        )
        Executive.objects.create(name='Old President', title='President', session='25/26', display_order=1)
        Executive.objects.create(name='New President', title='President', session='26/27', display_order=1)
        Executive.objects.create(name='Hidden', title='PRO', session='26/27', display_order=2, is_active=False)

    def test_public_list_is_unpaginated_and_hides_inactive(self):
        response = self.client.get(reverse('executive-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual({e['name'] for e in response.data}, {'Old President', 'New President'})
        self.assertEqual({e['session'] for e in response.data}, {'25/26', '26/27'})

    def test_filter_by_session(self):
        response = self.client.get(reverse('executive-list'), {'session': '25/26'})
        self.assertEqual([e['name'] for e in response.data], ['Old President'])

    def test_admin_can_create_executive_for_a_new_session(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse('executive-list'),
            {'name': 'Future Pres', 'title': 'President', 'session': '27/28', 'level': 'Computer Science 400 Level'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Executive.objects.get(name='Future Pres').session, '27/28')

    def test_session_is_required_and_validated(self):
        self.client.force_authenticate(user=self.admin)
        missing = self.client.post(reverse('executive-list'), {'name': 'X', 'title': 'Y'}, format='json')
        self.assertEqual(missing.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('session', missing.data)
        bad = self.client.post(
            reverse('executive-list'), {'name': 'X', 'title': 'Y', 'session': '2027/28'}, format='json',
        )
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('session', bad.data)

    def test_photo_link_accepts_https_and_site_paths_only(self):
        self.client.force_authenticate(user=self.admin)
        base = {'name': 'P', 'title': 'T', 'session': '27/28'}
        for link in ('https://res.cloudinary.com/x/image/upload/a.jpg', '/images/executives/2027-2028/a.png', ''):
            ok = self.client.post(reverse('executive-list'), {**base, 'photo_link': link}, format='json')
            self.assertEqual(ok.status_code, status.HTTP_201_CREATED, (link, ok.data))
            self.assertEqual(ok.data['photo_url'], link or None)
        for link in ('http://insecure.example/a.jpg', 'javascript:alert(1)', '//evil.example/a.jpg'):
            bad = self.client.post(reverse('executive-list'), {**base, 'photo_link': link}, format='json')
            self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST, link)

    def test_non_admins_cannot_write(self):
        payload = {'name': 'X', 'title': 'Y', 'session': '27/28'}
        anon = self.client.post(reverse('executive-list'), payload, format='json')
        self.assertIn(anon.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        self.client.force_authenticate(user=self.student)
        student = self.client.post(reverse('executive-list'), payload, format='json')
        self.assertEqual(student.status_code, status.HTTP_403_FORBIDDEN)


class SeedExecutivesTest(TestCase):
    def test_seed_is_idempotent_and_links_photos(self):
        entries = json.loads(SEED_FILE.read_text(encoding='utf-8'))
        call_command('seed_executives', stdout=StringIO())
        count = Executive.objects.count()
        self.assertEqual(count, len(entries))

        first = next(e for e in entries if e['photo'])
        seeded = Executive.objects.get(session=first['session'], title=first['title'], name=first['name'])
        self.assertEqual(seeded.photo_link, f"/images/executives/{first['photo']}")

        # Second run creates nothing and leaves admin edits alone.
        Executive.objects.filter(pk=seeded.pk).update(level='Edited in admin')
        call_command('seed_executives', stdout=StringIO())
        self.assertEqual(Executive.objects.count(), count)
        seeded.refresh_from_db()
        self.assertEqual(seeded.level, 'Edited in admin')

    def test_seed_syncs_site_path_photos_but_keeps_uploaded_ones(self):
        entries = json.loads(SEED_FILE.read_text(encoding='utf-8'))
        call_command('seed_executives', stdout=StringIO())
        with_photo = [e for e in entries if e['photo']][:3]
        blank, stale, uploaded = (
            Executive.objects.get(session=e['session'], title=e['title'], name=e['name'])
            for e in with_photo
        )
        Executive.objects.filter(pk=blank.pk).update(photo_link='')
        Executive.objects.filter(pk=stale.pk).update(photo_link='/images/executives/2025-2026/gone.jpg')
        Executive.objects.filter(pk=uploaded.pk).update(photo_link='https://res.cloudinary.com/x/new.jpg')

        call_command('seed_executives', stdout=StringIO())

        for row, entry in ((blank, with_photo[0]), (stale, with_photo[1])):
            row.refresh_from_db()
            self.assertEqual(row.photo_link, f"/images/executives/{entry['photo']}")
        uploaded.refresh_from_db()
        self.assertEqual(uploaded.photo_link, 'https://res.cloudinary.com/x/new.jpg')

    def test_seed_covers_both_sessions_and_photos_exist_in_frontend(self):
        entries = json.loads(SEED_FILE.read_text(encoding='utf-8'))
        self.assertEqual({e['session'] for e in entries}, {'25/26', '26/27'})
        # Every seeded photo must actually ship with the frontend.
        images = Path(__file__).resolve().parents[2] / 'frontend' / 'public' / 'images' / 'executives'
        missing = [e['photo'] for e in entries if e['photo'] and not (images / e['photo']).is_file()]
        self.assertEqual(missing, [])
