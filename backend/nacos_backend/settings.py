# backend/nacos_backend/settings.py

from datetime import timedelta
from pathlib import Path
import os
from dotenv import load_dotenv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

#  SECRET KEY
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-tx17(7h&pa@3^t+kh+!6v^+q8v&7w6e9vcji09320j+(058b+m",
)

#  Prevent insecure production deploy
if not os.getenv("DJANGO_DEBUG") and not os.getenv("DJANGO_SECRET_KEY"):
    raise Exception("DJANGO_SECRET_KEY must be set in production")

DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() in ("1", "true", "yes", "y", "on")

# Hosts
RENDER_EXTERNAL_HOSTNAME = os.getenv("RENDER_EXTERNAL_HOSTNAME")
ALLOWED_HOSTS = [
    h
    for h in [
        RENDER_EXTERNAL_HOSTNAME,
        "nacos-website-9g4v.onrender.com",
        "localhost",
        "127.0.0.1",
    ]
    if h
]

#  Apps
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
        "https://nacos-abuad0-website.vercel.app",
    ],
)

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = _split_env_list(
    "CSRF_TRUSTED_ORIGINS",
    [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://nacos-abuad0-website.vercel.app",
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
    "https://nacos-abuad0-website.vercel.app"
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

# DATABASE (Final Clean Version)

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    print("Using production database (Render/AWS)")
else:
    print("Using local SQLite database")

DATABASES = {
    'default': dj_database_url.config(
        default=DATABASE_URL or f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=60,
        ssl_require=bool(DATABASE_URL),
    )
}