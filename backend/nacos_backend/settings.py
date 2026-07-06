from datetime import timedelta
from pathlib import Path
import os

import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes", "y", "on")

#  SECRET KEY — dev-only default; production must set DJANGO_SECRET_KEY
_dev_secret = "django-insecure-tx17(7h&pa@3^t+kh+!6v^+q8v&7w6e9vcji09320j+(058b+m"
_secret_key = os.getenv("DJANGO_SECRET_KEY")
if DEBUG:
    SECRET_KEY = _secret_key or _dev_secret
else:
    if not _secret_key:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is disabled.")
    SECRET_KEY = _secret_key


def _allowed_hosts():
    raw = os.getenv("DJANGO_ALLOWED_HOSTS")
    if raw:
        return [h.strip() for h in raw.split(",") if h.strip()]
    if DEBUG:
        return ["127.0.0.1", "localhost"]
    raise ImproperlyConfigured(
        "DJANGO_ALLOWED_HOSTS must be set (comma-separated hostnames) when DJANGO_DEBUG is disabled."
    )


ALLOWED_HOSTS = _allowed_hosts()


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_filters',

    # local apps
    'accounts',
    'projects',
    'resources',
    'gallery',
    'events',
    'executives',
    'inquiries',
    'committees',
    'attendance',
    'dashboard',
    'face_auth',

    # third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
]

#  DRF
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # OptionalJWTAuthentication returns None (unauthenticated) for
        # invalid/expired tokens instead of raising a 401. This lets
        # AllowAny views stay accessible even when the client sends a
        # stale Bearer token. Authenticated views are unaffected — a None
        # result simply means the user is treated as anonymous, and
        # IsAuthenticated permission will then deny access as expected.
        'nacos_backend.authentication.OptionalJWTAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_RATES': {
        # Caps how many login attempts one IP can make per minute, so the
        # specific "no account" / "wrong password" error messages can't be
        # used to mass-probe emails or brute-force a password.
        'login': '10/min',
        # Account-creation spam.
        'register': '5/hour',
        # check-email / verify-student — both used pre-registration and
        # both leak "does this email/matric exist" — throttle to blunt
        # mass enumeration.
        'email_check': '20/hour',
        # Email verification (token-based; brute force is impractical, but
        # still capped to stop spam re-sends).
        'email_token': '5/min',
        # Prevents email-bombing a target inbox with reset requests, and
        # caps confirm attempts against a guessed/leaked token.
        'password_reset': '5/hour',
        # Face recognition runs a heavy TensorFlow inference per request
        # (the same one that spiked EC2 memory enough to stall the server
        # — see incident notes). Keep concurrent load low.
        'face_auth': '5/min',
    },
}

# Password-reset links expire in 30 minutes (Django's default_token_generator
# checks this against PASSWORD_RESET_TIMEOUT, in seconds). Without this
# override Django defaults to 3 days, which doesn't match what the reset
# email itself tells users ("this link expires in 30 minutes").
PASSWORD_RESET_TIMEOUT = 1800

#  Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'nacos_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'nacos_backend.wsgi.application'


# ─── DATABASE ────────────────────────────────────────────────────────────────
#
# Priority order:
#   1. DATABASE_URL env var          (production — Heroku / Railway style)
#   2. POSTGRES_HOST / DB_HOST var   (production — EC2 / ECS discrete vars)
#   3. SQLite fallback               (local dev — no env vars needed)
#
_database_url = os.getenv("DATABASE_URL")
_postgres_host = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST")

if _database_url:
    # ── Option 1: full DATABASE_URL ──────────────────────────────────────────
    _ssl_require = os.getenv("DATABASE_SSL_REQUIRE", "true").lower() in ("1", "true", "yes", "y", "on")
    DATABASES = {
        "default": dj_database_url.config(
            default=_database_url,
            conn_max_age=int(os.getenv("DB_CONN_MAX_AGE", "600")),
            ssl_require=_ssl_require,
        ),
    }

elif _postgres_host:
    # ── Option 2: discrete POSTGRES_* / DB_* vars ────────────────────────────
    _db_name = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME") or "postgres"
    _db_user = os.getenv("POSTGRES_USER") or os.getenv("DB_USER") or "postgres"
    _db_password = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD") or ""
    _db_port = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT") or "5432"
    _local_hosts = {"localhost", "127.0.0.1", "::1"}
    _default_sslmode = "prefer" if _postgres_host in _local_hosts else "require"
    _sslmode = os.getenv("POSTGRES_SSLMODE", _default_sslmode)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _db_name,
            "USER": _db_user,
            "PASSWORD": _db_password,
            "HOST": _postgres_host,
            "PORT": _db_port,
            "OPTIONS": {"sslmode": _sslmode},
        },
    }

else:
    # ── Option 3: SQLite — local development fallback ────────────────────────
    # Kicks in automatically when neither DATABASE_URL nor POSTGRES_HOST/DB_HOST
    # is set. db.sqlite3 is written next to manage.py and should be in .gitignore.
    if not DEBUG:
        raise ImproperlyConfigured(
            "No database configured. Set DATABASE_URL or POSTGRES_HOST in production."
        )
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


#  Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

#  JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

#  CORS / CSRF
def _split_env_list(name, default_list):
    raw = os.getenv(name)
    if not raw:
        return default_list
    return [x.strip() for x in raw.split(",") if x.strip()]

CORS_ALLOWED_ORIGINS = _split_env_list(
    "CORS_ALLOWED_ORIGINS",
    [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://nacosabuad.org",
        "https://www.nacosabuad.org",
    ],
)

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = _split_env_list(
    "CSRF_TRUSTED_ORIGINS",
    [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://nacosabuad.org",
        "https://www.nacosabuad.org",
    ],
)

# General
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'

# Email
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 465
EMAIL_USE_SSL = True
EMAIL_USE_TLS = False
EMAIL_TIMEOUT = 60
# EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "10"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = 'nacosabuad1@gmail.com'

# Unhandled server errors (500s) get emailed here via Django's built-in
# AdminEmailHandler — see LOGGING below. Comma-separated in the env var,
# e.g. ADMIN_EMAILS=you@example.com,other-admin@example.com
ADMINS = [("NACOS Admin", email) for email in _split_env_list("ADMIN_EMAILS", [])]
MANAGERS = ADMINS
# Avoids error emails going out as root@localhost, which many mail
# providers spam-filter or reject outright.
SERVER_EMAIL = DEFAULT_FROM_EMAIL

print("=" * 50)
print("EMAIL_HOST:", EMAIL_HOST)
print("EMAIL_PORT:", EMAIL_PORT)
print("EMAIL_USE_TLS:", EMAIL_USE_TLS)
print("EMAIL_HOST_USER:", EMAIL_HOST_USER)
print("EMAIL_HOST_PASSWORD EXISTS:", bool(EMAIL_HOST_PASSWORD))
print("=" * 50)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://nacosabuad.org",
)

# Cloudinary (project image uploads — secret must stay server-side only)
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
CLOUDINARY_UPLOAD_FOLDER = os.getenv("CLOUDINARY_UPLOAD_FOLDER", "nacos/projects")

# Custom flags
REQUIRE_STUDENT_VERIFICATION = True

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "{asctime} {levelname} {name} {message}", "style": "{"},
    },
    "filters": {
        "require_debug_false": {"()": "django.utils.log.RequireDebugFalse"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
        # Emails everyone in ADMINS the full traceback whenever an
        # unhandled exception reaches Django (i.e. a real bug, not an
        # expected 400/401/403/404/429 — DRF already turns those into
        # normal JSON responses without raising). Only fires when
        # DEBUG=False, matching production.
        "mail_admins": {
            "class": "django.utils.log.AdminEmailHandler",
            "level": "ERROR",
            "filters": ["require_debug_false"],
        },
    },
    "loggers": {
        "resources": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "django.request": {"handlers": ["console", "mail_admins"], "level": "ERROR", "propagate": False},
    },
}