"""Shared transactional email machinery.

Every email is sent as a multipart message: a nicely styled HTML body plus a
plain-text fallback (auto-derived from the HTML) so it renders everywhere.
App-specific senders live next to the app that owns them (see
`authentication/emails.py`, `orders/emails.py`) and call `send_html_email`.
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

SITE_NAME = getattr(settings, 'EMAIL_SITE_NAME', 'This Is Muay Thai')


def reply_to_address():
    """A monitored Reply-To, if one is configured.

    Worth setting: it is a positive signal for spam filters and lets recipients
    actually reach a human. Read per call so settings overrides apply.
    """
    return getattr(settings, 'EMAIL_REPLY_TO', '') or None

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
    reply_to = reply_to_address()
    base_context = {
        'site_name': SITE_NAME,
        'subject': subject,
        'preheader': preheader or subject,
        'cta_label': 'Open',
        'greeting': '',
        'footer_note': '',
        # Drives the footer: promising a reply we can't receive is worse than
        # saying nothing, so the invitation only appears with a Reply-To set.
        'can_reply': bool(reply_to),
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
        reply_to=[reply_to] if reply_to else None,
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


def send_html_email_safely(*, to_email, subject, template, context, preheader=''):
    """`send_html_email` that logs instead of raising.

    Used on paths where a dead SMTP server must not fail the surrounding
    operation — a customer who has already been charged should still get a
    success response even if the receipt email can't go out.
    """
    try:
        send_html_email(
            to_email=to_email,
            subject=subject,
            template=template,
            context=context,
            preheader=preheader,
        )
        return True
    except Exception:
        logger.exception('Failed to send %s email to %s', template, to_email)
        return False
