"""Front-end links that carry a signed, single-use token.

Built in one place so the token/uid pair and the route the front end serves can
never drift apart between the views and the emails that send them.
"""
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


def _tokenised(path, user):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    return f"{settings.FRONTEND_URL.rstrip('/')}{path}?token={token}&uid={uid}"


def email_verification_link(user):
    return _tokenised('/verify-email', user)


def password_reset_link(user):
    """Also the "set your password" link for an account created by someone else.

    `default_token_generator` hashes the account's current password into the
    token, so a token issued to an account that has none stops working the
    moment its owner chooses one — exactly the single-use behaviour an invite
    needs, with no second token type to expire and revoke.
    """
    return _tokenised('/reset-password', user)
