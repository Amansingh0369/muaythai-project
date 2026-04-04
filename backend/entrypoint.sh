#!/bin/bash

# Exit on any error
set -e

# Run migrations (ensure DB is in sync)
echo "Running migrations..."
python manage.py migrate --noinput

# Run the command passed as argument (e.g., runserver or gunicorn)
exec "$@"
