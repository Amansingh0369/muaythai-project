from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework import exceptions
from users.models import User

class GoogleAuthService:
    @staticmethod
    def verify_id_token(token: str):
        try:
            # Specify the GOOGLE_CLIENT_ID of the app that accesses the backend:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)

            # ID token is valid. Get the user's Google Account ID from the decoded token.
            # userid = idinfo['sub']
            return idinfo
        except ValueError:
            # Invalid token
            raise exceptions.AuthenticationFailed('Invalid Google ID token')

    @staticmethod
    def get_or_create_user(idinfo):
        email = idinfo.get('email')
        google_id = idinfo.get('sub')
        name = idinfo.get('name')
        
        if not email:
            raise exceptions.AuthenticationFailed('Email not provided in Google ID token')

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'google_id': google_id,
                'full_name': name
            }
        )
        
        # Update user if it was already existing but missing some info
        updated = False
        if not user.google_id:
            user.google_id = google_id
            updated = True
        if not user.full_name and name:
            user.full_name = name
            updated = True
        
        if updated:
            user.save()
            
        return user, created
