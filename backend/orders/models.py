from django.db import models
from django.conf import settings
from packages.models import Package

class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PAID = 'PAID', 'Paid'
    CANCELLED = 'CANCELLED', 'Cancelled'
    COMPLETED = 'COMPLETED', 'Completed'

class Order(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    package = models.ForeignKey(Package, on_delete=models.PROTECT, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    razorpay_order_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user.email} - {self.status}"

    class Meta:
        ordering = ['-created_at']


class ReminderKind(models.TextChoices):
    SEVEN_DAY = 'SEVEN_DAY', '7 days before start'
    ONE_DAY = 'ONE_DAY', '1 day before start'


class OrderReminder(models.Model):
    """One row per pre-arrival reminder actually sent.

    The unique constraint is what makes `send_package_reminders` safe to run
    repeatedly — a second run the same day, or a retry after a partial failure,
    cannot re-send a reminder the customer already received.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='reminders')
    kind = models.CharField(max_length=20, choices=ReminderKind.choices)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('order', 'kind')
        ordering = ['-sent_at']

    def __str__(self):
        return f"{self.get_kind_display()} for Order #{self.order_id}"
