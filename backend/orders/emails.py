"""Booking-lifecycle emails: payment receipts, failures, and start reminders.

The rendering/sending machinery lives in `core.emails`; this module owns the
copy, and the booking summary that every one of these emails carries.

A booking can cover several people, so a receipt or a reminder is one email per
participant rather than one per order. Each copy is addressed to that person and
tells them what *they* still need to do — claim the account that was created for
them, or finish the fighter card their trainers read before the camp. Only the
buyer's copy carries the money: someone booked in by a friend has no business
being told what that friend paid.
"""
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from django.utils.formats import date_format

from authentication.links import password_reset_link
from core.emails import send_html_email_safely
from fighters.models import FighterCard

TWO_PLACES = Decimal('0.01')


def bookings_url():
    """Where a customer manages their bookings on the web app.

    Resolved per call rather than at import so settings overrides apply.
    """
    return f"{settings.FRONTEND_URL.rstrip('/')}/profile"


def fighter_card_url():
    """Where a fighter fills in the card their trainers read before the camp.

    The card is a tab on the profile page, not a route of its own, so the link
    carries the query the frontend reads to open that tab directly. Someone
    whose card is already complete is sent to `bookings_url()` instead — see
    `_next_step`.
    """
    return f'{bookings_url()}?tab=fighter-card'


def effective_start_date(order):
    """The date the customer's program actually begins.

    An order may carry its own start date (a customer picking their intake);
    otherwise the package's fixed start date applies. Either can be null, in
    which case the date is simply unknown and callers must handle that.
    """
    return order.start_date or order.package.start_date


def _format_date(value):
    return date_format(value, 'l, j F Y') if value else 'To be confirmed'


def _format_amount(amount):
    """Render a Decimal as INR, with thousands separators and no noise decimals."""
    if amount is None:
        return '—'
    quantised = f'{amount:,.2f}'
    if quantised.endswith('.00'):
        quantised = quantised[:-3]
    return f'₹{quantised}'


def _format_locations(package):
    names = [f'{loc.name}, {loc.city}' for loc in package.locations.all()]
    return ' · '.join(names) if names else 'To be confirmed'


def _days_until(start_date):
    """Whole days from today until `start_date`, or None if unknown."""
    if not start_date:
        return None
    return (start_date - timezone.localdate()).days


def _countdown_phrase(days):
    """'today' / 'tomorrow' / 'in 7 days' — composed into copy by the callers."""
    if days is None:
        return ''
    if days == 0:
        return 'today'
    if days == 1:
        return 'tomorrow'
    return f'in {days} days'


def participant_names(order):
    """Everyone the booking covers, buyer first, as display names."""
    return [p.display_name for p in order.participants.all()]


def booking_details(order, payment=None, *, include_pricing=True):
    """The label/value rows shown in every booking email.

    Kept in one place so a receipt and a reminder describe the same booking
    identically — differing summaries across emails read as untrustworthy.

    `include_pricing` is off for a guest's copy: the booking is theirs, the
    payment is not.
    """
    package = order.package
    start_date = effective_start_date(order)
    count = order.participant_count

    rows = [
        {'label': 'Booking reference', 'value': f'#{order.id}'},
        {'label': 'Package', 'value': package.name},
        {'label': 'Level', 'value': package.get_type_display()},
    ]
    if package.duration_days:
        rows.append({'label': 'Duration', 'value': f'{package.duration_days} days'})
    rows.append({'label': 'Location', 'value': _format_locations(package)})
    rows.append({'label': 'Starts', 'value': _format_date(start_date)})
    if start_date and package.duration_days:
        end_date = start_date + timedelta(days=package.duration_days - 1)
        rows.append({'label': 'Ends', 'value': _format_date(end_date)})
    if count > 1:
        rows.append({'label': 'Booking covers', 'value': f'{count} fighters'})

    if include_pricing:
        # Per-person price comes from the frozen subtotal, not from the package,
        # so a receipt reprinted after a price change still adds up.
        if count > 1:
            per_person = (order.subtotal_amount / count).quantize(TWO_PLACES)
            rows.append({
                'label': f'Package price ({count} × {_format_amount(per_person)})',
                'value': _format_amount(order.subtotal_amount),
            })
        # Only itemise a single place when a discount actually applied — a
        # "₹0 off" line on every full-price receipt is noise.
        elif order.discount_amount:
            rows.append({'label': 'Package price', 'value': _format_amount(order.subtotal_amount)})
        if order.discount_amount:
            discount_label = f'Discount ({order.coupon.code})' if order.coupon else 'Discount'
            rows.append({
                'label': discount_label,
                'value': f'− {_format_amount(order.discount_amount)}',
            })
        rows.append({'label': 'Amount', 'value': _format_amount(order.total_amount)})
        if payment and payment.razorpay_payment_id:
            rows.append({'label': 'Payment ID', 'value': payment.razorpay_payment_id})
    return rows


def _needs_account_setup(user):
    """Whether this person still has no way to sign in.

    True for an account created for them at someone else's checkout and never
    claimed. A Google sign-in counts as a way in, even with no password set.
    """
    return not user.has_usable_password() and not user.google_id


def fighter_card_note(user):
    """A nudge to finish this fighter's card, or '' when there is nothing to do.

    The card is what the trainers read before a camp — experience, goals, and
    the injuries to work around — so an incomplete one is the single most useful
    thing to raise in a booking email. Saying it to someone who has already
    finished theirs would make every other line read as boilerplate, so a
    complete card gets no note at all.
    """
    card = FighterCard.objects.filter(user=user).first()
    if card is None:
        return ('You have not started your fighter card yet. Your trainers use it to plan '
                'your sessions, so please fill it in before you join the camp.')
    if card.is_complete:
        return ''
    remaining = len(card.missing_fields)
    return (f'Your fighter card is not complete — {remaining} '
            f'question{"" if remaining == 1 else "s"} still to answer. Please finish it '
            'before you join the camp so your trainers can plan your sessions.')


def _next_step(user, card_note):
    """The one thing this person should do next: (url, label).

    A ladder rather than a list of links. Someone who cannot sign in yet is sent
    to set a password — the fighter card lives behind that sign-in anyway, so
    pointing them at the card first would just bounce them. Everyone else goes
    to the card if it needs work, and to their bookings if it does not.
    """
    if _needs_account_setup(user):
        return password_reset_link(user), 'Set your password'
    if card_note:
        return fighter_card_url(), 'Complete your fighter card'
    return bookings_url(), 'View your booking'


def send_order_confirmation_emails(*, order, payment=None):
    """Tell everyone the booking covers that it is confirmed.

    Returns the number of emails that went out. A send that fails is logged by
    `send_html_email_safely` and never stops the remaining recipients — one dead
    address must not cost the other fighters their confirmation.
    """
    participants = list(order.participants.select_related('user'))
    return sum(
        1 for participant in participants
        if send_participant_confirmation_email(
            order=order, participant=participant, payment=payment)
    )


def send_participant_confirmation_email(*, order, participant, payment=None):
    """One participant's copy of the receipt: theirs, and what they must do next."""
    user = participant.user
    start_date = effective_start_date(order)
    days = _days_until(start_date)
    card_note = fighter_card_note(user)
    cta_url, cta_label = _next_step(user, card_note)
    buyer_name = order.user.full_name or order.user.email

    if days is not None and days >= 0:
        highlight_note = (f'Training starts {_countdown_phrase(days)}. '
                          'We will remind you as the date approaches.')
    else:
        highlight_note = 'We will remind you as the date approaches.'

    if participant.is_buyer:
        subject = f'Booking confirmed — {order.package.name}'
        preheader = f'Your place on {order.package.name} is secured.'
        heading = 'Your booking is confirmed'
        footer_note = ('Keep this email for your records — it is your proof of booking. '
                       'If any detail above looks wrong, get in touch and we will fix it.')
    else:
        subject = f'You are booked in — {order.package.name}'
        preheader = f'{buyer_name} has booked you onto {order.package.name}.'
        heading = f'{buyer_name} has booked you in'
        footer_note = ('Nothing to pay — this place has already been paid for. If you did not '
                       'expect this booking, get in touch and we will sort it out.')

    return send_html_email_safely(
        to_email=user.email,
        subject=subject,
        template='emails/order_confirmation.html',
        preheader=preheader,
        context={
            'heading': heading,
            'greeting': f'Hi {participant.display_name or "there"},',
            'package_name': order.package.name,
            'is_buyer': participant.is_buyer,
            'booked_by': buyer_name,
            'fighters': participant_names(order),
            'fighter_card_note': card_note,
            'fighter_card_url': fighter_card_url(),
            'needs_account_setup': _needs_account_setup(user),
            'highlight_label': 'Training starts' if start_date else 'Start date',
            'highlight_value': _format_date(start_date),
            'highlight_note': highlight_note,
            'details_title': 'Booking summary',
            'details': booking_details(order, payment, include_pricing=participant.is_buyer),
            'cta_url': cta_url,
            'cta_label': cta_label,
            'footer_note': footer_note,
        },
    )


def send_payment_failed_email(*, order, reason=''):
    """Sent when a payment attempt does not complete, so the customer can retry.

    Buyer only: nobody else on the booking has anything to retry, and telling a
    friend about a payment that failed would be the first they heard of a
    booking that does not exist yet.
    """
    user = order.user
    return send_html_email_safely(
        to_email=user.email,
        subject=f'Payment unsuccessful — {order.package.name}',
        template='emails/payment_failed.html',
        preheader='Your payment did not go through. Your place is still available.',
        context={
            'heading': 'Your payment did not go through',
            'greeting': f'Hi {user.full_name or "there"},',
            'package_name': order.package.name,
            'failure_reason': reason,
            'details_title': 'Booking attempted',
            'details': booking_details(order),
            'cta_url': bookings_url(),
            'cta_label': 'Try payment again',
            'footer_note': 'You have not been charged. If your bank shows a pending amount, it '
                           'will be released automatically by your bank.',
        },
    )


def send_package_reminder_email(*, order, participant, days_until):
    """Pre-arrival reminder for one participant.

    `days_until` drives the copy, so the same template serves both the 7-day and
    the next-day nudge. The fighter-card nudge rides along because this is the
    last useful moment to act on it — a card finished after arrival is a card
    the trainers never got to read.
    """
    user = participant.user
    start_date = effective_start_date(order)
    phrase = _countdown_phrase(days_until)
    card_note = fighter_card_note(user)
    cta_url, cta_label = _next_step(user, card_note)

    if days_until <= 1:
        subject = f'Starting {phrase} — {order.package.name}'
        preheader = 'Final details before you arrive.'
    else:
        subject = f'{days_until} days to go — {order.package.name}'
        preheader = f'Your program starts {phrase}.'

    return send_html_email_safely(
        to_email=user.email,
        subject=subject,
        template='emails/package_reminder.html',
        preheader=preheader,
        context={
            'heading': f'Your training starts {phrase}',
            'greeting': f'Hi {participant.display_name or "there"},',
            'package_name': order.package.name,
            'days_until': days_until,
            'when_phrase': phrase,
            # The final nudge carries arrival practicalities; the 7-day one is
            # about planning, so the copy branches rather than duplicating.
            'is_final_reminder': days_until <= 1,
            'fighter_card_note': card_note,
            'fighter_card_url': fighter_card_url(),
            'needs_account_setup': _needs_account_setup(user),
            'highlight_label': 'Training starts',
            'highlight_value': _format_date(start_date),
            'details_title': 'Booking summary',
            'details': booking_details(order, include_pricing=participant.is_buyer),
            'cta_url': cta_url,
            'cta_label': cta_label,
            'footer_note': 'Need to change anything before you arrive? Get in touch as early as '
                           'you can and we will sort it out.',
        },
    )
