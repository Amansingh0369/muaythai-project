from django.urls import path
from .views import (
    GoogleLoginView, CookieTokenRefreshView, LogoutView,
    RegisterView, VerifyEmailView, ResendVerificationEmailView, LoginView,
    PasswordResetRequestView, PasswordResetConfirmView
)

urlpatterns = [
    path('google/', GoogleLoginView.as_view(), name='google_login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('verify-email/resend/', ResendVerificationEmailView.as_view(), name='verify_email_resend'),
    path('login/', LoginView.as_view(), name='login'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
