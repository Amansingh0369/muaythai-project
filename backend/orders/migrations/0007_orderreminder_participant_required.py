"""Make the reminder's participant mandatory, now that every row has one.

Split from 0005 so the backfill in 0006 can run in between: a reminder written
before group bookings existed has no participant until that migration attaches
it to the buyer.
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0006_backfill_order_participants'),
    ]

    operations = [
        # Dropped before the field changes and re-added after: the constraint
        # being replaced names one of the columns being altered.
        migrations.AlterUniqueTogether(
            name='orderreminder',
            unique_together=set(),
        ),
        migrations.AlterField(
            model_name='orderreminder',
            name='participant',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='reminders',
                to='orders.orderparticipant',
            ),
        ),
        migrations.AlterUniqueTogether(
            name='orderreminder',
            unique_together={('order', 'kind', 'participant')},
        ),
    ]
