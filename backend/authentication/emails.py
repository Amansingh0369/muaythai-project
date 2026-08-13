"""Reusable transactional email helpers.

Every email is sent as a multipart message: a nicely styled HTML body plus a
plain-text fallback (auto-derived from the HTML) so it renders everywhere.
"""
import html
import logging
import re
from email.mime.base import MIMEBase
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

SITE_NAME = getattr(settings, 'EMAIL_SITE_NAME', 'Muay Thai Training')

# A monitored Reply-To (rather than a bare no-reply From) is a positive signal
# for spam filters and lets recipients actually reach us. Optional.
REPLY_TO = getattr(settings, 'EMAIL_REPLY_TO', None)

# Brand logos shipped with the app and embedded in every email as inline
# (cid:) attachments. Remote <img src="https://..."> is blocked by default in
# most clients; inline parts render without the recipient opting in.
BRAND_ASSETS_DIR = Path(__file__).resolve().parent / 'assets' / 'email'
BRAND_LOGOS = (
    # (context variable, filename, content id)
    ('logo_mark_cid', 'logo-mark.png', 'brand-mark'),
    ('logo_wordmark_cid', 'logo-wordmark.png', 'brand-wordmark'),
)


class _RelatedAlternativeEmail(EmailMultiAlternatives):
    """Lets us hand Django a pre-built MIME part to use as an alternative.

    Django base64-encodes any non-text alternative, which would flatten the
    multipart/related container we build in `send_html_email`; passing MIMEBase
    instances straight through keeps the structure intact.
    """

    def _create_mime_attachment(self, content, mimetype):
        if isinstance(content, MIMEBase):
            return content
        return super()._create_mime_attachment(content, mimetype)


def _load_brand_logos():
    """Return (template_context, inline_image_parts) for the brand lockup.

    Both are empty if any asset is missing, so the template falls back to a
    plain-text brand header rather than rendering broken images.
    """
    context, images = {}, []
    for context_key, filename, content_id in BRAND_LOGOS:
        path = BRAND_ASSETS_DIR / filename
        try:
            data = path.read_bytes()
        except OSError:
            logger.warning('Email brand asset missing: %s', path)
            return {}, []
        image = MIMEImage(data)
        image.add_header('Content-ID', f'<{content_id}>')
        image.add_header('Content-Disposition', 'inline', filename=filename)
        context[context_key] = content_id
        images.append(image)
    return context, images


def send_html_email(*, to_email, subject, template, context, preheader=''):
    """Render `template` (which extends emails/base_email.html) and send it.

    context is merged with sensible brand defaults so individual callers only
    need to pass what differs (heading, cta_url, etc.).
    """
    logo_context, logo_images = _load_brand_logos()
    base_context = {
        'site_name': SITE_NAME,
        'subject': subject,
        'preheader': preheader or subject,
        'cta_label': 'Open',
        'greeting': '',
        'footer_note': '',
        **logo_context,
    }
    base_context.update(context)

    html_body = render_to_string(template, base_context)
    # Plain-text fallback: strip tags and collapse the runs of whitespace left
    # behind by the HTML layout, then append the action URL so text-only clients
    # still get a usable link.
    # unescape() so entities in the layout (&copy;, &amp;) don't reach the reader
    # as literal markup — spam classifiers score the plain-text part too.
    text_body = html.unescape(strip_tags(html_body))
    text_body = re.sub(r'[ \t]+', ' ', text_body)
    text_body = re.sub(r'\n\s*\n\s*', '\n\n', text_body).strip()
    cta_url = base_context.get('cta_url')
    if cta_url and cta_url not in text_body:
        text_body = f"{text_body}\n\n{cta_url}"

    message = _RelatedAlternativeEmail(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
        reply_to=[REPLY_TO] if REPLY_TO else None,
    )
    if logo_images:
        # The images must live in a multipart/related *alongside the HTML part*
        # for clients to resolve the cid: references. Django's documented
        # mixed_subtype='related' recipe instead makes them siblings of the whole
        # alternative container, which Gmail renders as broken images plus two
        # stray attachments.
        related = MIMEMultipart('related')
        related.attach(MIMEText(html_body, 'html', 'utf-8'))
        for image in logo_images:
            related.attach(image)
        message.attach_alternative(related, 'multipart/related')
    else:
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
