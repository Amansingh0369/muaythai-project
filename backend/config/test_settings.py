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
