"""Turning the people named at checkout into participants on an order.

Every participant on a booking needs a `User`, because the fighter card the
trainers read before a camp is per-user. So a buyer who adds a friend who has
never used the site creates that friend's account here — unverified, and
without a usable password. The confirmation email is what invites them to
claim it; nothing in this module logs anyone in, so naming someone at checkout
never grants the buyer access to their account.
"""
from django.db import IntegrityError, transaction
from rest_framework import serializers

from users.models import User

from .models import MAX_ORDER_PARTICIPANTS, OrderParticipant


def normalise_email(email):
    """Lower-cased and trimmed, so the same person is the same participant.

    Addresses reach us from three places — the buyer's account, a friend typed
    into checkout, and an existing account created at registration — and two of
    those are free text. Matching them needs one spelling.
    """
    return User.objects.normalize_email((email or '').strip()).lower()


def clean_guest_list(guests, *, buyer):
    """Normalise a validated guest list, or raise DRF ValidationError.

    Shared by order creation and by replacing the guest list on a pending
    order, so both routes reject the same things for the same reasons.
    """
    buyer_email = normalise_email(buyer.email)
    cleaned, seen = [], {buyer_email}

    for guest in guests:
        email = normalise_email(guest['email'])
        if email == buyer_email:
            raise serializers.ValidationError({'guests': [
                'You are already on this booking — you do not need to add yourself as a guest.',
            ]})
        if email in seen:
            raise serializers.ValidationError({'guests': [
                f'{email} appears on this booking more than once.',
            ]})
        seen.add(email)
        cleaned.append({'email': email, 'full_name': guest['full_name'].strip()})

    # The buyer counts towards the cap: it limits the size of the booking, not
    # the length of the guest list.
    if len(seen) > MAX_ORDER_PARTICIPANTS:
        raise serializers.ValidationError({'guests': [
            f'A booking can cover at most {MAX_ORDER_PARTICIPANTS} people, including you. '
            'Please place a second booking for anyone else.',
        ]})
    return cleaned


def provision_participant(*, email, full_name=''):
    """Return the `User` for `email`, creating an invited account if needed.

    Returns `(user, created)`. A newly created account has no usable password
    and is not email-verified: it is a placeholder its owner claims by setting
    a password from the link in their confirmation email.

    An existing account is never modified — not even to fill in a blank name.
    The buyer typed that name into their own checkout, and letting it overwrite
    what the account holder chose would let anyone rename a stranger.
    """
    email = normalise_email(email)
    existing = User.objects.filter(email__iexact=email).first()
    if existing:
        return existing, False

    user = User(email=email, full_name=(full_name or '').strip() or None)
    user.set_unusable_password()
    try:
        # Nested atomic: a duplicate-email IntegrityError must not poison the
        # checkout transaction this runs inside.
        with transaction.atomic():
            user.save()
    except IntegrityError:
        # Lost a race with a concurrent checkout or a registration for the same
        # address. The account exists now, which is all we needed.
        existing = User.objects.filter(email__iexact=email).first()
        if existing is None:
            raise
        return existing, False
    return user, True


def set_participants(*, order, buyer, guests):
    """Make the order's participants exactly the buyer plus `guests`.

    Replaces the whole list rather than merging: the client sends the guest
    list it wants, and diffing it here would leave the two disagreeing whenever
    a request was lost. Safe because participants can only change while an
    order is pending, before any money has moved.

    The buyer is always present and always first — adding a friend extends
    their own place on the camp, it never replaces it.
    """
    order.participants.all().delete()

    OrderParticipant.objects.create(
        order=order,
        user=buyer,
        full_name=buyer.full_name or '',
        email=buyer.email,
        is_buyer=True,
    )
    for guest in guests:
        user, _ = provision_participant(email=guest['email'], full_name=guest['full_name'])
        OrderParticipant.objects.create(
            order=order,
            user=user,
            full_name=guest['full_name'],
            email=guest['email'],
            is_buyer=False,
        )
