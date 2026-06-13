import os
from pathlib import Path
import dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
dotenv.load_dotenv(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = 'django-insecure-your-secret-key-here'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
  
    
    # Third-party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'channels',
    'crispy_forms',
    'crispy_tailwind',
    
    # Local
    'accounts',
    'shops',
    'api',
    'products',
    'orders',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'local_connect.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'local_connect.wsgi.application'
ASGI_APPLICATION = 'local_connect.asgi.application'

import urllib.parse as urlparse

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Override with environment variable DATABASE_URL if present (e.g., Neon Postgres on Render)
if os.environ.get('DATABASE_URL'):
    db_url = os.environ.get('DATABASE_URL')
    if db_url.startswith('postgres://') or db_url.startswith('postgresql://'):
        url = urlparse.urlparse(db_url)
        DATABASES['default'] = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': url.path[1:],
            'USER': url.username,
            'PASSWORD': url.password,
            'HOST': url.hostname,
            'PORT': url.port or 5432,
            'CONN_MAX_AGE': 60,  # Keep-warm optimization for serverless Neon database compute nodes
        }

# Password validation
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
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'accounts.CustomUser'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Channels
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}

# Crispy Forms
CRISPY_ALLOWED_TEMPLATE_PACKS = "tailwind"
CRISPY_TEMPLATE_PACK = "tailwind"

# Login URLs
LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = 'home'
LOGOUT_REDIRECT_URL = 'home'

# ASGI Application setting for Django Channels
ASGI_APPLICATION = 'local_connect.asgi.application'

# Khalti Payment Gateway Settings
KHALTI_SECRET_KEY = os.environ.get('KHALTI_SECRET_KEY', 'Key 802897a5f4d54ac0a1dbbe4db61f1d17')

# Email Configuration
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'Sajilo Dokan <noreply@sajilodokan.com>')

# Cloudinary Settings (Stateless Media uploads on Render)
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    # Inserts cloudinary_storage before django.contrib.staticfiles
    try:
        idx = INSTALLED_APPS.index('django.contrib.staticfiles')
        INSTALLED_APPS.insert(idx, 'cloudinary_storage')
    except ValueError:
        INSTALLED_APPS.append('cloudinary_storage')
    
    INSTALLED_APPS.append('cloudinary')
    
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
        'API_KEY': CLOUDINARY_API_KEY,
        'API_SECRET': CLOUDINARY_API_SECRET,
    }
    
    STORAGES = {
        "default": {
            "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }