"""
Test settings for Django tests.
Overrides production settings to use SQLite for testing.
"""
from .settings import *

# Override database to use SQLite for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Enable AUTH_USER_MODEL for testing
AUTH_USER_MODEL = 'users.User'

# Production settings force every request to https (DEBUG is False in .env);
# the test client speaks http and would otherwise get a 301 for every request.
SECURE_SSL_REDIRECT = False

# Uploads must never reach the real S3 bucket. Individual tests that exercise
# file handling also override this themselves, so they stay safe whichever
# settings module they are run under.
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.InMemoryStorage'},
    'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
}
