# Django OAuth JWT Authentication System

A Django REST Framework backend that provides authentication services using Google OAuth and JWT tokens.

## Features

- Google OAuth 2.0 authentication
- JWT access and refresh tokens
- Token blacklisting for secure logout
- Role-based access control (USER and ADMIN roles)
- PostgreSQL database
- Clean architecture with separation of concerns

## Project Structure

```
.
├── config/              # Django project settings
├── users/               # User model and user management
├── authentication/      # Authentication endpoints (Google OAuth, token refresh, logout)
├── core/                # Shared utilities and permissions
├── manage.py
├── requirements.txt
└── .env                 # Environment variables (not in git)
```

## Prerequisites

- Python 3.10+
- PostgreSQL 14+
- pip or pip3

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
pip3 install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Create PostgreSQL database:
```bash
createdb django_auth
```

5. Run migrations (after User model is implemented):
```bash
python3 manage.py migrate
```

6. Create a superuser (after User model is implemented):
```bash
python3 manage.py createsuperuser
```

7. Run the development server:
```bash
python3 manage.py runserver
```

## Environment Variables

Required environment variables (see `.env.example`):

- `SECRET_KEY`: Django secret key for cryptographic signing
- `DEBUG`: Set to `True` for development, `False` for production
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `DB_NAME`: PostgreSQL database name
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `GOOGLE_CLIENT_ID`: Google OAuth 2.0 client ID
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## API Endpoints

### Authentication

- `POST /api/auth/google/` - Authenticate with Google OAuth
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/logout/` - Logout and blacklist refresh token

## Development

### Running Tests

```bash
pytest
```

### Running Tests with Coverage

```bash
pytest --cov=. --cov-report=html
```

### Code Style

This project follows PEP 8 style guidelines.

## Architecture

The system follows clean architecture principles:

- **users app**: Contains the custom User model and user management logic
- **authentication app**: Handles authentication flows (Google OAuth, JWT tokens)
- **core app**: Contains shared utilities, permissions, and middleware

## Security

- JWT tokens with short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days)
- Refresh tokens stored in HTTP-only cookies
- Token blacklisting for secure logout
- HTTPS enforcement in production
- CORS configuration for cross-origin requests
- Role-based access control

## License

[Your License Here]
