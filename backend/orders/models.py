from decimal import Decimal

from django.db import models
from django.conf import settings
from core.constants import MIN_PAYABLE_AMOUNT
from coupons.models import Coupon
from packages.models import Package

class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PAID = 'PAID', 'Paid'
    CANCELLED = 'CANCELLED', 'Cancelled'
    COMPLETED = 'COMPLETED', 'Completed'

class Order(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    package = models.ForeignKey(Package, on_delete=models.PROTECT, related_name='orders')
    # Package price as it stood when the order was placed. Frozen, because the
    # package price can change later and a receipt must stay reproducible.
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    # At most one coupon per order — enforced structurally by this being a
    # single FK rather than a many-to-many.
    coupon = models.ForeignKey(
        Coupon, on_delete=models.PROTECT, null=True, blank=True, related_name='orders',
    )
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    # What the customer actually pays: subtotal_amount - discount_amount.
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

    def recalculate_totals(self):
        """Re-derive discount and total from the package price and coupon.

        Always recomputed server-side from the coupon record — a client-supplied
        discount is never trusted.

        A discount is trimmed so the total never drops below
        MIN_PAYABLE_AMOUNT: an order the gateway refuses to process is worse for
        the customer than a slightly smaller discount, since it leaves them
        holding a booking they cannot pay for. The coupon still applies for as
        much as it can. Only a package priced under the minimum can still
        produce an unpayable total, and `payments` rejects that separately.
        """
        self.subtotal_amount = self.package.price
        if self.coupon:
            self.discount_amount = self.coupon.compute_discount(self.subtotal_amount)
        else:
            self.discount_amount = Decimal('0.00')
        headroom = max(self.subtotal_amount - MIN_PAYABLE_AMOUNT, Decimal('0.00'))
        self.discount_amount = min(self.discount_amount, headroom)
        self.total_amount = self.subtotal_amount - self.discount_amount


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
