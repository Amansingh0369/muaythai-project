"""Booking-lifecycle emails: payment receipts, failures, and start reminders.

The rendering/sending machinery lives in `core.emails`; this module owns the
copy, and the booking summary that every one of these emails carries.
"""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from django.utils.formats import date_format

from core.emails import send_html_email_safely


def bookings_url():
    """Where a customer manages their bookings on the web app.

    Resolved per call rather than at import so settings overrides apply.
    """
    return f"{settings.FRONTEND_URL.rstrip('/')}/profile"


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


def booking_details(order, payment=None):
    """The label/value rows shown in every booking email.

    Kept in one place so a receipt and a reminder describe the same booking
    identically — differing summaries across emails read as untrustworthy.
    """
    package = order.package
    start_date = effective_start_date(order)

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
    # Only itemise when a discount actually applied — a "₹0 off" line on every
    # full-price receipt is noise.
    if order.discount_amount:
        rows.append({'label': 'Package price', 'value': _format_amount(order.subtotal_amount)})
        discount_label = f'Discount ({order.coupon.code})' if order.coupon else 'Discount'
        rows.append({'label': discount_label, 'value': f'− {_format_amount(order.discount_amount)}'})
    rows.append({'label': 'Amount', 'value': _format_amount(order.total_amount)})
    if payment and payment.razorpay_payment_id:
        rows.append({'label': 'Payment ID', 'value': payment.razorpay_payment_id})
    return rows


def send_order_confirmation_email(*, order, payment=None):
    """Receipt + booking summary, sent once a payment is verified."""
    start_date = effective_start_date(order)
    days = _days_until(start_date)
    user = order.user

    if days is not None and days >= 0:
        highlight_note = (f'Your training starts {_countdown_phrase(days)}. '
                          'We will remind you as the date approaches.')
    else:
        highlight_note = 'We will remind you as the date approaches.'

    return send_html_email_safely(
        to_email=user.email,
        subject=f'Booking confirmed — {order.package.name}',
        template='emails/order_confirmation.html',
        preheader=f'Your place on {order.package.name} is secured.',
        context={
            'heading': 'Your booking is confirmed',
            'greeting': f'Hi {user.full_name or "there"},',
            'package_name': order.package.name,
            'highlight_label': 'Training starts' if start_date else 'Start date',
            'highlight_value': _format_date(start_date),
            'highlight_note': highlight_note,
            'details_title': 'Booking summary',
            'details': booking_details(order, payment),
            'cta_url': bookings_url(),
            'cta_label': 'View your booking',
            'footer_note': 'Keep this email for your records — it is your proof of booking. '
                           'If any detail above looks wrong, get in touch and we will fix it.',
        },
    )


def send_payment_failed_email(*, order, reason=''):
    """Sent when a payment attempt does not complete, so the customer can retry."""
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


def send_package_reminder_email(*, order, days_until):
    """Pre-arrival reminder. `days_until` drives the copy, so the same template
    serves both the 7-day and the next-day nudge."""
    user = order.user
    start_date = effective_start_date(order)
    phrase = _countdown_phrase(days_until)

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
            'greeting': f'Hi {user.full_name or "there"},',
            'package_name': order.package.name,
            'days_until': days_until,
            'when_phrase': phrase,
            # The final nudge carries arrival practicalities; the 7-day one is
            # about planning, so the copy branches rather than duplicating.
            'is_final_reminder': days_until <= 1,
            'highlight_label': 'Training starts',
            'highlight_value': _format_date(start_date),
            'details_title': 'Booking summary',
            'details': booking_details(order),
            'cta_url': bookings_url(),
            'cta_label': 'View your booking',
            'footer_note': 'Need to change anything before you arrive? Get in touch as early as '
                           'you can and we will sort it out.',
        },
    )
