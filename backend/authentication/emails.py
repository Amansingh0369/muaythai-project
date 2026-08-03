"""Reusable transactional email helpers.

Every email is sent as a multipart message: a nicely styled HTML body plus a
plain-text fallback (auto-derived from the HTML) so it renders everywhere.
"""
import re

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

SITE_NAME = getattr(settings, 'EMAIL_SITE_NAME', 'Muay Thai Training')


def send_html_email(*, to_email, subject, template, context, preheader=''):
    """Render `template` (which extends emails/base_email.html) and send it.

    context is merged with sensible brand defaults so individual callers only
    need to pass what differs (heading, cta_url, etc.).
    """
    base_context = {
        'site_name': SITE_NAME,
        'subject': subject,
        'preheader': preheader or subject,
        'cta_label': 'Open',
        'greeting': '',
        'footer_note': '',
    }
    base_context.update(context)

    html_body = render_to_string(template, base_context)
    # Plain-text fallback: strip tags and collapse the runs of whitespace left
    # behind by the HTML layout, then append the action URL so text-only clients
    # still get a usable link.
    text_body = strip_tags(html_body)
    text_body = re.sub(r'[ \t]+', ' ', text_body)
    text_body = re.sub(r'\n\s*\n\s*', '\n\n', text_body).strip()
    cta_url = base_context.get('cta_url')
    if cta_url and cta_url not in text_body:
        text_body = f"{text_body}\n\n{cta_url}"

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    message.attach_alternative(html_body, 'text/html')
    message.send(fail_silently=False)


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
