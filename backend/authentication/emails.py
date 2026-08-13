"""Account-lifecycle emails (verification, password reset).

The rendering/sending machinery lives in `core.emails`; this module only owns
the copy and context for auth-related messages.
"""
from core.emails import send_html_email


def send_verification_email(*, user, verification_link):
    """Email a user the link to verify their address."""
    send_html_email(
        to_email=user.email,
        subject='Verify your email address',
        template='emails/verify_email.html',
        preheader='Confirm your email to activate your account.',
        context={
            'heading': 'Verify your email',
            'greeting': f'Hi {user.full_name or "there"},',
            'cta_url': verification_link,
            'cta_label': 'Verify email',
            'footer_note': "If you didn't create an account, you can safely ignore this email.",
        },
    )


def send_password_reset_email(*, user, reset_link, expiry_minutes):
    """Email a user the link to reset their password."""
    send_html_email(
        to_email=user.email,
        subject='Reset your password',
        template='emails/password_reset.html',
        preheader='Reset the password for your account.',
        context={
            'heading': 'Reset your password',
            'greeting': f'Hi {user.full_name or "there"},',
            'cta_url': reset_link,
            'cta_label': 'Reset password',
            'expiry_minutes': expiry_minutes,
            'footer_note': "If you didn't request a password reset, you can safely ignore this "
                           "email — your password will remain unchanged.",
        },
    )
