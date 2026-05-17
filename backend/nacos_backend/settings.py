# backend/nacos_backend/settings.py

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
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

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
use_sqlite = os.getenv('USE_SQLITE')

# Database: DATABASE_URL (recommended) or POSTGRES_* / DB_* discrete variables
_database_url = os.getenv("DATABASE_URL")
if _database_url:
    _ssl_require = os.getenv("DATABASE_SSL_REQUIRE", "true").lower() in ("1", "true", "yes", "y", "on")
    DATABASES = {
        "default": dj_database_url.config(
            default=_database_url,
            conn_max_age=int(os.getenv("DB_CONN_MAX_AGE", "600")),
            ssl_require=_ssl_require,
        ),
    }
else:
    _db_name = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME") or "postgres"
    _db_user = os.getenv("POSTGRES_USER") or os.getenv("DB_USER") or "postgres"
    _db_password = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD") or ""
    _db_host = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST") or "localhost"
    _db_port = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT") or "5432"
    _local_hosts = {"localhost", "127.0.0.1", "::1"}
    _default_sslmode = "prefer" if _db_host in _local_hosts else "require"
    _sslmode = os.getenv("POSTGRES_SSLMODE", _default_sslmode)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _db_name,
            "USER": _db_user,
            "PASSWORD": _db_password,
            "HOST": _db_host,
            "PORT": _db_port,
            "OPTIONS": {"sslmode": _sslmode},
        },
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

# 📧 Email
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "10"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = 'nacosabuad1@gmail.com'

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://nacosabuad.org",
)

# Custom flags
REQUIRE_STUDENT_VERIFICATION = True

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "{asctime} {levelname} {name} {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "loggers": {
        "resources": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
