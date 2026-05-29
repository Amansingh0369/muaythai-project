import pytest
from unittest.mock import patch
from django.urls import reverse
from django.core import mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def unregistered_user_data():
    return {
        'email': 'newuser@example.com',
        'password': 'StrongSecurePassword123!',
        'full_name': 'New User'
    }

@pytest.fixture
def created_unverified_user(db):
    user = User.objects.create_user(
        email='unverified@example.com',
        password='StrongSecurePassword123!',
        full_name='Unverified User'
    )
    user.is_email_verified = False
    user.save()
    return user

@pytest.fixture
def created_verified_user(db):
    user = User.objects.create_user(
        email='verified@example.com',
        password='StrongSecurePassword123!',
        full_name='Verified User'
    )
    user.is_email_verified = True
    user.save()
    return user

@pytest.mark.django_db
def test_user_signup_success(api_client, unregistered_user_data):
    """
    Test that a user can successfully sign up.
    The user is created active, but with is_email_verified=False.
    An email should be sent with the verification link.
    """
    url = reverse('register')
    response = api_client.post(url, unregistered_user_data, format='json')
    
    assert response.status_code == status.HTTP_201_CREATED
    assert 'Registration successful' in response.data['message']
    
    # Check that user exists in database
    user = User.objects.get(email=unregistered_user_data['email'])
    assert user.is_active is True
    assert user.is_email_verified is False
    
    # Verify that an email was sent
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == [unregistered_user_data['email']]
    assert 'Verify your email address' in mail.outbox[0].subject

@pytest.mark.django_db
def test_unverified_user_cannot_login(api_client, created_unverified_user):
    """
    Test that a registered user who has not verified their email is blocked from logging in,
    returning a 403 Forbidden status code.
    """
    url = reverse('login')
    payload = {
        'email': created_unverified_user.email,
        'password': 'StrongSecurePassword123!'
    }
    response = api_client.post(url, payload, format='json')
    
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert 'Please verify your email address before logging in' in response.data['error']

@pytest.mark.django_db
def test_verified_user_can_login(api_client, created_verified_user):
    """
    Test that a user with a verified email can successfully log in and receive JWT tokens.
    """
    url = reverse('login')
    payload = {
        'email': created_verified_user.email,
        'password': 'StrongSecurePassword123!'
    }
    response = api_client.post(url, payload, format='json')
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data['message'] == 'Login successful'
    assert 'access' in response.data
    # Refresh token should be in cookies
    assert 'refresh_token' in response.cookies

@pytest.mark.django_db
def test_email_verification_success(api_client, created_unverified_user):
    """
    Test that a valid verification token correctly marks is_email_verified=True.
    """
    token = default_token_generator.make_token(created_unverified_user)
    uid = urlsafe_base64_encode(force_bytes(created_unverified_user.pk))
    
    url = reverse('verify_email')
    payload = {
        'uid': uid,
        'token': token
    }
    response = api_client.post(url, payload, format='json')
    
    assert response.status_code == status.HTTP_200_OK
    assert 'successfully verified' in response.data['message']
    
    created_unverified_user.refresh_from_db()
    assert created_unverified_user.is_email_verified is True

@pytest.mark.django_db
def test_resend_verification_email(api_client, created_unverified_user):
    """
    Test resending the verification email.
    """
    url = reverse('verify_email_resend')
    payload = {'email': created_unverified_user.email}
    
    response = api_client.post(url, payload, format='json')
    
    assert response.status_code == status.HTTP_200_OK
    assert 'verification link has been sent' in response.data['message']
    
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == [created_unverified_user.email]

@pytest.mark.django_db
def test_google_login_auto_verifies_email(api_client):
    """
    Test that Google OAuth automatically registers a user as verified (is_email_verified=True).
    """
    mock_id_info = {
        'email': 'googleuser@example.com',
        'sub': '1234567890googleid',
        'name': 'Google User'
    }
    
    with patch('authentication.services.GoogleAuthService.verify_id_token', return_value=mock_id_info):
        url = reverse('google_login')
        payload = {'id_token': 'fake-valid-google-token'}
        response = api_client.post(url, payload, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        
        user = User.objects.get(email='googleuser@example.com')
        assert user.is_email_verified is True
        assert user.is_active is True

@pytest.mark.django_db
def test_password_reset_flow(api_client, created_verified_user):
    """
    Test password reset request and confirm flow.
    """
    # 1. Request Reset
    request_url = reverse('password_reset')
    request_payload = {'email': created_verified_user.email}
    request_response = api_client.post(request_url, request_payload, format='json')
    
    assert request_response.status_code == status.HTTP_200_OK
    assert len(mail.outbox) == 1
    assert 'Password Reset Request' in mail.outbox[0].subject
    
    # Extract token and uidb64 from outbox email
    email_body = mail.outbox[0].message
    # Find link or generate tokens manually to verify check
    token = default_token_generator.make_token(created_verified_user)
    uid = urlsafe_base64_encode(force_bytes(created_verified_user.pk))
    
    # 2. Confirm Reset
    confirm_url = reverse('password_reset_confirm')
    confirm_payload = {
        'uid': uid,
        'token': token,
        'new_password': 'BrandNewSecurePassword999!'
    }
    confirm_response = api_client.post(confirm_url, confirm_payload, format='json')
    
    assert confirm_response.status_code == status.HTTP_200_OK
    assert 'reset successfully' in confirm_response.data['message']
    
    # 3. Verify Login with New Password
    login_url = reverse('login')
    login_payload = {
        'email': created_verified_user.email,
        'password': 'BrandNewSecurePassword999!'
    }
    login_response = api_client.post(login_url, login_payload, format='json')
    assert login_response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_logout_clears_cookie(api_client, created_verified_user):
    """
    Test that logout clears the cookie and succeeds.
    """
    # Authenticate first
    login_url = reverse('login')
    login_payload = {
        'email': created_verified_user.email,
        'password': 'StrongSecurePassword123!'
    }
    login_response = api_client.post(login_url, login_payload, format='json')
    access_token = login_response.data['access']
    
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    logout_url = reverse('logout')
    logout_response = api_client.post(logout_url, format='json')
    
    assert logout_response.status_code == status.HTTP_200_OK
    assert logout_response.data['message'] == 'Logged out successfully'
    # Cookie should be cleared (deleted value or expiration set to epoch)
    cookie = logout_response.cookies.get('refresh_token')
    assert cookie is not None
    assert cookie.value == '' or cookie['expires'] == 'Thu, 01 Jan 1970 00:00:00 GMT'
