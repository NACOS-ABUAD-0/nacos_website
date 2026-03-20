# backend/resources/management/commands/sync_google_drive.py
import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from resources.models import Resource, ResourceCategory
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow


class Command(BaseCommand):
    help = 'Sync resources from Google Drive folder'

    # Google Drive API scopes
    SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

    def add_arguments(self, parser):
        parser.add_argument(
            '--folder-id',
            type=str,
            default='1aY0l8s1lOGwZWOGZgGsQ2zPAlK8dWxdR',
            help='Google Drive folder ID to sync'
        )
        parser.add_argument(
            '--credentials-file',
            type=str,
            default='credentials.json',
            help='Path to Google OAuth2 credentials file'
        )

    def authenticate(self, credentials_file):
        """Authenticate with Google Drive API"""
        creds = None

        # Token file stores the user's access and refresh tokens
        token_file = 'token.json'

        if os.path.exists(token_file):
            creds = Credentials.from_authorized_user_file(token_file, self.SCOPES)

        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(credentials_file):
                    raise FileNotFoundError(
                        f"Credentials file '{credentials_file}' not found. "
                        "Please download it from Google Cloud Console."
                    )
                flow = InstalledAppFlow.from_client_secrets_file(
                    credentials_file, self.SCOPES)
                creds = flow.run_local_server(port=0)

            # Save the credentials for the next run
            with open(token_file, 'w') as token:
                token.write(creds.to_json())

        return creds

    def get_folder_structure(self, service, folder_id):
        """Recursively get folder structure and files"""

        def get_files_in_folder(folder_id, path=""):
            results = []
            query = f"'{folder_id}' in parents and trashed = false"
            page_token = None

            while True:
                response = service.files().list(
                    q=query,
                    spaces='drive',
                    fields="nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, parents)",
                    pageSize=1000,
                    pageToken=page_token
                ).execute()

                for item in response.get('files', []):
                    item_path = f"{path}/{item['name']}" if path else item['name']

                    if item['mimeType'] == 'application/vnd.google-apps.folder':
                        # Recursively get files in subfolder
                        results.extend(get_files_in_folder(item['id'], item_path))
                    else:
                        # Add file with full path
                        item['full_path'] = item_path
                        results.append(item)

                page_token = response.get('nextPageToken', None)
                if not page_token:
                    break

            return results

        return get_files_in_folder(folder_id)

    def extract_course_info(self, file_name, full_path):
        """Extract course code and year from file name and path"""
        # Common patterns for course codes (e.g., CSC101, MAT201)
        import re

        # Look for course codes in the format ABC123
        course_pattern = r'[A-Z]{3,4}\s?\d{3}'
        matches = re.findall(course_pattern, file_name.upper())

        course_code = matches[0].replace(' ', '') if matches else None

        # Look for year patterns
        year_pattern = r'(?:20)\d{2}'
        year_matches = re.findall(year_pattern, file_name)
        year = year_matches[0] if year_matches else None

        # Extract from path segments
        if not course_code:
            path_parts = full_path.split('/')
            for part in path_parts:
                matches = re.findall(course_pattern, part.upper())
                if matches:
                    course_code = matches[0].replace(' ', '')
                    break

        return course_code, year

    def handle(self, *args, **options):
        folder_id = options['folder_id']
        credentials_file = options['credentials_file']

        self.stdout.write(f"Syncing resources from Google Drive folder: {folder_id}")

        try:
            # Authenticate with Google Drive
            creds = self.authenticate(credentials_file)
            service = build('drive', 'v3', credentials=creds)

            # Get all files recursively
            files = self.get_folder_structure(service, folder_id)
            self.stdout.write(f"Found {len(files)} files in Drive folder")

            # Sync with database
            synced_count = 0
            for file_data in files:
                # Skip folders (we only process files)
                if file_data['mimeType'] == 'application/vnd.google-apps.folder':
                    continue

                # Extract course information
                course_code, year = self.extract_course_info(
                    file_data['name'],
                    file_data.get('full_path', '')
                )

                # Create or update resource
                resource, created = Resource.objects.update_or_create(
                    drive_file_id=file_data['id'],
                    defaults={
                        'title': file_data['name'],
                        'url': file_data['webViewLink'],
                        'download_url': file_data.get('webContentLink'),
                        'course_code': course_code,
                        'year': year,
                        'file_size': file_data.get('size'),
                        'file_type': file_data['mimeType'],
                        'drive_metadata': {
                            'created_time': file_data.get('createdTime'),
                            'modified_time': file_data.get('modifiedTime'),
                            'icon_link': file_data.get('iconLink'),
                            'full_path': file_data.get('full_path')
                        }
                    }
                )

                if created:
                    synced_count += 1
                    self.stdout.write(f"Added: {file_data['name']}")
                else:
                    self.stdout.write(f"Updated: {file_data['name']}")

            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully synced {synced_count} resources from Google Drive"
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error syncing Google Drive: {str(e)}")
            )

