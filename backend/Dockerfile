# Use Python 3.11 slim as base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /app

# Install system dependencies (no longer need postgres)
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files (including db.sqlite3 since it's not ignored)
COPY . /app/

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Entrypoint setup
ENTRYPOINT ["/app/entrypoint.sh"]
