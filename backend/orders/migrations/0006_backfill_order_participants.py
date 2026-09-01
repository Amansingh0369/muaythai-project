"""Give every pre-existing order the participant row it now needs.

Before group bookings, an order implicitly covered exactly one person: whoever
placed it. That is now recorded explicitly, and pricing, confirmation emails and
reminders all read the participant rows — so an order without one would price at
zero and email nobody. Every historical order therefore gets a single buyer
participant, snapshotting the buyer's name and email as they stand today, and
every reminder already sent is attached to it so it is not sent a second time.
"""
from django.db import migrations


def create_buyer_participants(apps, schema_editor):
    Order = apps.get_model('orders', 'Order')
    OrderParticipant = apps.get_model('orders', 'OrderParticipant')
    OrderReminder = apps.get_model('orders', 'OrderReminder')

    already_covered = set(OrderParticipant.objects.values_list('order_id', flat=True))
    OrderParticipant.objects.bulk_create(
        [
            OrderParticipant(
                order_id=order.id,
                user_id=order.user_id,
                full_name=order.user.full_name or '',
                email=order.user.email,
                is_buyer=True,
            )
            for order in Order.objects.select_related('user').iterator()
            if order.id not in already_covered
        ],
        batch_size=500,
    )

    # Reminders predate participants, so each one belongs to the buyer by
    # definition — that was the only person an order could reach. Read the ids
    # back rather than trusting bulk_create to return them, which not every
    # database backend does.
    by_order = dict(
        OrderParticipant.objects.filter(is_buyer=True).values_list('order_id', 'id')
    )
    for reminder in OrderReminder.objects.filter(participant__isnull=True):
        participant_id = by_order.get(reminder.order_id)
        if participant_id is None:
            continue
        reminder.participant_id = participant_id
        reminder.save(update_fields=['participant'])


def drop_buyer_participants(apps, schema_editor):
    """Reverse by detaching reminders; the rows themselves go with the model."""
    OrderReminder = apps.get_model('orders', 'OrderReminder')
    OrderReminder.objects.update(participant=None)


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0005_orderparticipant_orderreminder_participant'),
    ]

    operations = [
        migrations.RunPython(create_buyer_participants, drop_buyer_participants),
    ]
