"""Send pre-arrival reminders for paid bookings.

Intended to run once a day from cron:

    0 9 * * *  cd /app && python manage.py send_package_reminders

Safe to run more than once a day, and safe to re-run after a failure: every
reminder sent is recorded per participant, and the record is what gates the next
send. A booking that covers three people reminds all three, and a send that
fails for one of them is retried for that person alone on the next run.
"""
from django.core.management.base import BaseCommand
from django.db import IntegrityError, transaction
from django.utils import timezone

from orders.emails import effective_start_date, send_package_reminder_email
from orders.models import Order, OrderReminder, OrderStatus, ReminderKind

# Most urgent first. A reminder is due when the start date is within its window
# and it has not been sent yet — a threshold rather than an exact-day match, so
# a day of missed cron runs doesn't silently drop everyone's reminder.
REMINDER_WINDOWS = (
    (ReminderKind.ONE_DAY, 1),
    (ReminderKind.SEVEN_DAY, 7),
)


class Command(BaseCommand):
    help = 'Email 7-day and next-day reminders for upcoming paid bookings.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Report what would be sent without sending or recording anything.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        today = timezone.localdate()

        orders = (
            Order.objects.filter(status=OrderStatus.PAID)
            .select_related('package')
            .prefetch_related('package__locations', 'participants__user', 'reminders')
        )

        sent = skipped = failed = 0
        for order in orders:
            start_date = effective_start_date(order)
            if not start_date:
                continue

            days_until = (start_date - today).days
            if days_until < 0:
                continue  # already under way

            for participant in order.participants.all():
                # Read from the prefetched reminders rather than querying per
                # participant: a booking's reminders are a handful of rows, and
                # the alternative is two queries per person per run.
                already_sent = {
                    reminder.kind for reminder in order.reminders.all()
                    if reminder.participant_id == participant.id
                }
                due = [
                    kind for kind, window in REMINDER_WINDOWS
                    if days_until <= window and kind not in already_sent
                ]
                if not due:
                    skipped += 1
                    continue

                # REMINDER_WINDOWS is ordered most-urgent-first, so due[0] is the
                # tightest window that applies. A booking made three days out is
                # past the 7-day mark, so it gets the next-day nudge and nothing
                # else — marking every due kind sent stops the looser one firing
                # later.
                if dry_run:
                    self.stdout.write(
                        f'[dry-run] Order #{order.id} ({participant.email}) '
                        f'starts in {days_until}d → would send {due[0]}, marking {due}'
                    )
                    sent += 1
                    continue

                if send_package_reminder_email(
                        order=order, participant=participant, days_until=days_until):
                    self._record(order, participant, due)
                    sent += 1
                    self.stdout.write(
                        f'Order #{order.id} ({participant.email}): sent {due[0]} '
                        f'({days_until}d to start)'
                    )
                else:
                    # send_package_reminder_email logs the traceback. Leaving it
                    # unrecorded means tomorrow's run retries it.
                    failed += 1
                    self.stderr.write(f'Order #{order.id} ({participant.email}): send failed')

        summary = f'Reminders sent: {sent}, up to date: {skipped}, failed: {failed}'
        self.stdout.write(self.style.SUCCESS(summary) if not failed else self.style.WARNING(summary))

    def _record(self, order, participant, kinds):
        """Mark reminders as sent, tolerating a concurrent run that beat us to it."""
        for kind in kinds:
            try:
                with transaction.atomic():
                    OrderReminder.objects.create(
                        order=order, participant=participant, kind=kind)
            except IntegrityError:
                pass
