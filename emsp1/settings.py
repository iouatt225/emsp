from pathlib import Path
from datetime import timedelta
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY", default="django-insecure-change-me")
DEBUG = env.bool("DEBUG", default=True)
ALLOWED_HOSTS = env.list(
    "ALLOWED_HOSTS",
    default=["localhost", "127.0.0.1", ".onrender.com"],
)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channels',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'apps.accounts',
    'apps.core',
    'apps.formations',
    'apps.actualites',
    'apps.mediatheque',
    'apps.inscriptions',
    'apps.scolarite',
    'apps.comptabilite',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'emsp1.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'emsp1.context_processors.global_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'emsp1.wsgi.application'
ASGI_APPLICATION = 'emsp1.asgi.application'


DEFAULT_DATABASE_URL = f"sqlite:///{(BASE_DIR / 'db.sqlite3').as_posix()}"
DEFAULT_MYSQL_SQL_MODE = env(
    "MYSQL_SQL_MODE",
    default="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ZERO_DATE,NO_ZERO_IN_DATE,NO_ENGINE_SUBSTITUTION",
)
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=DEFAULT_DATABASE_URL,
    )
}

if DATABASES["default"]["ENGINE"] == "django.db.backends.mysql":
    DATABASES["default"].setdefault("OPTIONS", {})
    DATABASES["default"]["OPTIONS"].setdefault("charset", "utf8mb4")
    DATABASES["default"]["OPTIONS"].setdefault(
        "init_command",
        f"SET sql_mode='{DEFAULT_MYSQL_SQL_MODE}'",
    )

SUPABASE_STORAGE_BUCKET = env("SUPABASE_STORAGE_BUCKET", default="")
SUPABASE_STORAGE_ENDPOINT = env("SUPABASE_STORAGE_ENDPOINT", default="")
SUPABASE_STORAGE_ACCESS_KEY = env("SUPABASE_STORAGE_ACCESS_KEY", default="")
SUPABASE_STORAGE_SECRET_KEY = env("SUPABASE_STORAGE_SECRET_KEY", default="")
SUPABASE_STORAGE_PUBLIC_URL = env("SUPABASE_STORAGE_PUBLIC_URL", default="")
SUPABASE_STORAGE_REGION = env("SUPABASE_STORAGE_REGION", default="eu-west-1")
SUPABASE_STORAGE_LOCATION = env("SUPABASE_STORAGE_LOCATION", default="media")
USE_SUPABASE_STORAGE = all(
    [
        SUPABASE_STORAGE_BUCKET,
        SUPABASE_STORAGE_ENDPOINT,
        SUPABASE_STORAGE_ACCESS_KEY,
        SUPABASE_STORAGE_SECRET_KEY,
    ]
)

AWS_ACCESS_KEY_ID = SUPABASE_STORAGE_ACCESS_KEY
AWS_SECRET_ACCESS_KEY = SUPABASE_STORAGE_SECRET_KEY
AWS_STORAGE_BUCKET_NAME = SUPABASE_STORAGE_BUCKET
AWS_S3_ENDPOINT_URL = SUPABASE_STORAGE_ENDPOINT
AWS_S3_REGION_NAME = SUPABASE_STORAGE_REGION
AWS_S3_SIGNATURE_VERSION = "s3v4"
AWS_LOCATION = SUPABASE_STORAGE_LOCATION
AWS_DEFAULT_ACL = None
AWS_S3_FILE_OVERWRITE = False
AWS_QUERYSTRING_AUTH = False
AWS_S3_ADDRESSING_STYLE = "path"
AWS_S3_CUSTOM_DOMAIN = SUPABASE_STORAGE_PUBLIC_URL
AWS_S3_OBJECT_PARAMETERS = {
    "CacheControl": "max-age=86400",
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'fr-fr'

TIME_ZONE = 'Africa/Abidjan'

USE_I18N = True

USE_TZ = True


STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

if USE_SUPABASE_STORAGE:
    STORAGES["default"] = {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    }

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

AUTH_USER_MODEL = 'accounts.CustomUser'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

CORS_ALLOW_ALL_ORIGINS = env.bool("CORS_ALLOW_ALL_ORIGINS", default=DEBUG)
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOWED_ORIGIN_REGEXES = env.list(
    "CORS_ALLOWED_ORIGIN_REGEXES",
    default=[r"^https://.*\.onrender\.com$"],
)
CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=["https://*.onrender.com"],
)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=not DEBUG)
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=not DEBUG)

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}
