# Nacos Backend API Endpoints

Base URL:
- `https://<render-backend-host>/api/`
- Local dev (example): `http://localhost:8000/api/`

Notes:
- Most endpoints use DRF and expect/return JSON.
- Many endpoints use DRF routers, so URLs include trailing slashes.
- Auth uses SimpleJWT. Send: `Authorization: Bearer <access_token>`
- **Staff-only writes:** Creating, updating, or deleting events, executives, or gallery images requires an authenticated user with `is_staff=True` (admin). Public users can only use safe methods (`GET`, `HEAD`, `OPTIONS`) on published/active records.
- **File uploads (gallery, executive photos):** use `multipart/form-data` with `Authorization: Bearer <access_token>`. JSON-only requests cannot send binary image data.
- **Media URLs:** In local `DEBUG` mode, uploaded files are served under `/media/...`. In production you must configure your host (e.g. reverse proxy or object storage) to serve `MEDIA_ROOT`; Django does not serve user uploads when `DEBUG=False`.

## Admin

- `GET /admin/`
  - Django admin site (requires admin login).

## Accounts / Auth

### Register
- `POST /api/auth/register/`
  - Public (no auth required)
  - Body (JSON):
    - `email` (string, required, must be a valid email; must be unique)
    - `full_name` (string, required)
    - `matric_number` (string, optional; format validated if provided)
    - `password` (string, required; validated by Django password validators)
    - `password2` (string, required; must match `password`)
  - Responses:
    - `201`:
      - `refresh` (string)
      - `access` (string)
      - `user` (profile fields)
      - `message` (verification email message; may note that email verification is not configured)
    - `400` on validation errors (serializer returns field-specific messages)

### Login
- `POST /api/auth/login/`
  - Public
  - Body (JSON):
    - `email` (string, required)
    - `password` (string, required)
  - Responses:
    - `200`:
      - `refresh` (string)
      - `access` (string)
      - `user` (profile fields)
    - `400` if credentials are invalid

### Logout
- `POST /api/auth/logout/`
  - Auth required
  - Body (JSON):
    - `refresh` (string) (refresh token to blacklist)
  - Responses:
    - `205` on success
    - `400` if token handling fails

### Current user
- `GET /api/auth/me/`
  - Auth required
  - Response (profile):
    - `id`, `email`, `full_name`, `matric_number`, `date_joined`, `is_email_verified`

- `PATCH /api/auth/me/`
  - Auth required
  - Body (JSON) (optional fields):
    - `full_name`
    - `matric_number` (validated if provided)

### CSRF token
- `GET /api/auth/csrf/`
  - Public
  - Response:
    - `csrfToken`

### Verify email
- `POST /api/auth/verify-email/`
  - Public
  - Body (JSON):
    - `uid` (string)
    - `token` (string)
  - Responses:
    - `200`:
      - `message`
      - `user` (profile)
    - `400`:
      - `error` ("Invalid or expired verification link." or missing fields)

### Resend verification email
- `POST /api/auth/resend-verification/`
  - Auth required
  - Body: none
  - Responses:
    - `200` if email is sent
    - `400` if already verified
    - `500` if sending fails on the server

### Refresh access token
- `POST /api/auth/token/refresh/`
  - Public
  - Body (JSON):
    - `refresh` (string)
  - Response:
    - `access` (string)

## Projects

### Skill tags
- `GET /api/skilltags/`
  - Public
  - Response: list of `{ id, name, created_at }`

- `GET /api/skilltags/{id}/`
  - Public
  - Response: `{ id, name, created_at }`

### Projects (published list + CRUD)
- `GET /api/projects/`
  - Public (only projects where `status="published"`)
  - Query params:
    - `search` (string): matches `title`, `description`, and `tags__name`
    - `tag_names` (string, comma-separated): e.g. `tag1,tag2`
    - ordering: `created_at`, `updated_at`, `title`
    - filters (via django-filter): `tags`, `owner`, `is_featured`
  - Response: list of projects

- `POST /api/projects/`
  - Auth required
  - Body (JSON):
    - `title` (string)
    - `description` (string)
    - `tag_ids` (array of skill tag IDs, optional)
    - `images` (array, optional)
    - `links` (object/dict, optional)
    - `is_featured` (boolean, optional)
    - `status` (string, optional; default is `published` unless overridden)
  - Behavior:
    - `owner` is set automatically from the authenticated user.

- `GET /api/projects/{id}/`
  - Public (because the viewset queryset filters to `published`)

- `PUT /api/projects/{id}/`
  - Auth required
  - Permission: must be owner or staff

- `PATCH /api/projects/{id}/`
  - Auth required
  - Permission: must be owner or staff

- `DELETE /api/projects/{id}/`
  - Auth required
  - Permission: must be owner or staff

### Toggle featured (admin/staff only)
- `POST /api/projects/{id}/toggle_featured/`
  - Auth required
  - Permission: `request.user.is_staff` only
  - Body: none
  - Response:
    - `{ "is_featured": true|false }`

### My projects
- `GET /api/projects/my_projects/`
  - Auth required
  - Response: projects owned by the current user

## Resources

### Resource categories
- `GET /api/resource-categories/`
  - Public

- `GET /api/resource-categories/{id}/`
  - Public

### Resource tags
- `GET /api/resource-tags/`
  - Public

- `GET /api/resource-tags/{id}/`
  - Public

### Resources (public list + details)
- `GET /api/resources/`
  - Public (only where `is_public=True`)
  - Query params:
    - `search` (string): matches `title`, `description`, `course_code`, and `tags__name`
    - `recent` (truthy value, optional): if present, filters to last 30 days
    - filters (via django-filter): `category`, `course_code`, `year`, `tags`
    - ordering: `title`, `created_at`, `download_count`, `file_size`
  - Response fields include:
    - `id`, `title`, `description`, `url`, `download_url`
    - `course_code`, `year`, `category`, `tags`
    - `file_type`, `file_size`
    - `file_size_display`, `file_icon` (derived)
    - `download_count`, `is_public`, `created_at`, `updated_at`

- `GET /api/resources/{id}/`
  - Public
  - Includes `drive_metadata`

### Track download
- `POST /api/resources/{id}/track_download/`
  - Public
  - Body: none
  - Behavior:
    - increments `download_count`
    - records a `ResourceDownload` with:
      - user if authenticated, otherwise `null`
      - IP from `X-Forwarded-For` (first value) or `REMOTE_ADDR`
  - Response:
    - `download_url` (uses `download_url` if present, otherwise `url`)
    - `download_count`

## Events

Public listing shows only **published** events (`is_published=true`). Staff (`is_staff`) see all events when listing and can create, edit, or delete any event.

### List & CRUD
- `GET /api/events/`
  - Public
  - Query params:
    - `search` (string): `name`, `location`, `description`
    - ordering: `start_time`, `end_time`, `created_at`, `name`
    - filter: `is_published` (staff only useful when staff sees full queryset)
  - Response: list of events

- `POST /api/events/`
  - **Staff only**
  - Body (JSON):
    - `name` (string, required)
    - `start_time` (datetime ISO 8601, required)
    - `end_time` (datetime, optional)
    - `location` (string, required)
    - `description` (string, optional)
    - `registration_url` (URL string, optional)
    - `contact_email` (email string, optional)
    - `is_published` (boolean, optional; default `true`)

- `GET /api/events/{id}/`
  - Public for published events; staff can retrieve any event by id

- `PUT /api/events/{id}/` / `PATCH /api/events/{id}/`
  - **Staff only**
  - Body: same fields as create (partial allowed on `PATCH`)

- `DELETE /api/events/{id}/`
  - **Staff only**

### Attendance & QR check-in

Each attendee gets a unique `check_in_token` for a specific event. That token is the QR payload source.

- `GET /api/events/{id}/attendees/`
  - **Staff only**
  - Returns all attendee records for that event with check-in status.

- `POST /api/events/{id}/register_attendee/`
  - **Staff only**
  - Body (JSON):
    - `student_id` (integer, required; user id of the student)
  - Behavior:
    - creates a unique attendance record per `(event, student)` if missing
    - returns attendance + QR payload values
  - Response includes:
    - `created` (boolean)
    - `attendance` (record details)
    - `payload`:
      - `event_id`
      - `check_in_token`
      - `qr_value` (string to encode as QR, format: `event:{event_id}:token:{check_in_token}`)

- `GET /api/events/{id}/my_qr/`
  - Auth required (student/user)
  - Returns the authenticated user attendance record and QR payload for that event.
  - `404` if the user is not registered for that event.

- `GET /api/events/{id}/my_qr_png/`
  - Auth required (student/user)
  - Returns a PNG image directly (`Content-Type: image/png`) for the authenticated user's event attendance QR code.
  - The encoded content follows: `event:{event_id}:token:{check_in_token}`
  - `404` if the user is not registered for that event.

- `POST /api/events/{id}/check_in/`
  - **Staff only** (scanner/check-in admin)
  - Body (JSON):
    - `check_in_token` (UUID string, required)
  - Behavior:
    - validates token belongs to that event
    - marks attendee checked-in (`is_checked_in=true`, sets `checked_in_at`, `checked_in_by`)
    - if already checked in, returns current record with message

## Executives

Public listing shows only **active** executives (`is_active=true`). Staff see all records and can create, update, or delete.

### List & CRUD
- `GET /api/executives/`
  - Public
  - Query params:
    - `search` (string): `name`, `title`, `job_description`, `email`
    - ordering: `display_order`, `name`, `created_at`
    - filter: `is_active`
  - Response fields include:
    - `id`, `name`, `title`, `job_description`
    - `email`, `phone`, `website`, `linkedin_url`
    - `photo_url` (absolute URL if a photo exists; read-only)
    - `display_order`, `is_active`, `created_at`, `updated_at`

- `POST /api/executives/`
  - **Staff only**
  - Body (`multipart/form-data` recommended if uploading `photo`):
    - `name` (string, required)
    - `title` (string, required) — executive office or role title
    - `job_description` (string, optional)
    - `email` (string, optional)
    - `phone` (string, optional)
    - `website` (URL, optional)
    - `linkedin_url` (URL, optional)
    - `photo` (file, optional)
    - `display_order` (integer, optional; default `0`)
    - `is_active` (boolean, optional; default `true`)

- `GET /api/executives/{id}/`
  - Public for active executives; staff can retrieve any

- `PUT /api/executives/{id}/` / `PATCH /api/executives/{id}/`
  - **Staff only**
  - Same fields as create; `photo` optional on `PATCH`

- `DELETE /api/executives/{id}/`
  - **Staff only**

## Gallery

Public listing shows only **published** images (`is_published=true`). Staff see all images and can upload, edit, or remove entries.

### List & CRUD
- `GET /api/gallery/`
  - Public
  - Query params:
    - ordering: `display_order`, `created_at`
    - filter: `is_published`
  - Response fields:
    - `id`, `image_url` (absolute URL to the image file)
    - `caption`, `alt_text`, `display_order`, `is_published`
    - `created_at`, `updated_at`

- `POST /api/gallery/`
  - **Staff only**
  - Body (`multipart/form-data`):
    - `image` (file, **required**)
    - `caption` (string, optional)
    - `alt_text` (string, optional)
    - `display_order` (integer, optional; default `0`)
    - `is_published` (boolean, optional; default `true`)

- `GET /api/gallery/{id}/`
  - Public for published images; staff can retrieve any

- `PUT /api/gallery/{id}/` / `PATCH /api/gallery/{id}/`
  - **Staff only**
  - Include `image` (file) only when replacing the file; other fields can be JSON or multipart

- `DELETE /api/gallery/{id}/`
  - **Staff only**

