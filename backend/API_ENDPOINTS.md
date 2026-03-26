# Nacos Backend API Endpoints

Base URL:
- `https://<render-backend-host>/api/`
- Local dev (example): `http://localhost:8000/api/`

Notes:
- Most endpoints use DRF and expect/return JSON.
- Many endpoints use DRF routers, so URLs include trailing slashes.
- Auth uses SimpleJWT. Send: `Authorization: Bearer <access_token>`

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

