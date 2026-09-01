from decimal import Decimal

from django.db import models
from django.conf import settings
from core.constants import MIN_PAYABLE_AMOUNT
from coupons.models import Coupon
from packages.models import Package

#: Hard ceiling on how many people one booking may cover, the buyer included.
#: Checkout provisions an account for any participant who does not have one, so
#: without a cap a single order would be a bulk account-creation tool.
MAX_ORDER_PARTICIPANTS = 10

class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PAID = 'PAID', 'Paid'
    CANCELLED = 'CANCELLED', 'Cancelled'
    COMPLETED = 'COMPLETED', 'Completed'

class Order(models.Model):
    """One booking, covering one or more people.

    `user` is the buyer — the person who placed the order and pays for it. Who
    the booking is *for* lives in `participants`, which always includes the
    buyer and may include friends they booked alongside themselves.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    package = models.ForeignKey(Package, on_delete=models.PROTECT, related_name='orders')
    # Package price as it stood when the order was placed, times the number of
    # people it covers. Frozen, because both the package price and the
    # participant list can change later and a receipt must stay reproducible.
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

    @property
    def participant_count(self):
        """How many people this booking covers.

        Floored at one so pricing can never collapse to zero: the buyer is
        always a participant, and the rows are only ever absent in the instant
        between an order being created and its participants being written.
        """
        return max(self.participants.count(), 1)

    def recalculate_totals(self):
        """Re-derive subtotal, discount and total from the package and coupon.

        The subtotal is the package price once per participant — a booking for
        two people costs twice as much — and is always recomputed server-side
        from the participant rows, never from a client-supplied count.

        A discount is trimmed so the total never drops below
        MIN_PAYABLE_AMOUNT: an order the gateway refuses to process is worse for
        the customer than a slightly smaller discount, since it leaves them
        holding a booking they cannot pay for. The coupon still applies for as
        much as it can. Only a package priced under the minimum can still
        produce an unpayable total, and `payments` rejects that separately.
        """
        self.subtotal_amount = self.package.price * self.participant_count
        if self.coupon:
            self.discount_amount = self.coupon.compute_discount(self.subtotal_amount)
        else:
            self.discount_amount = Decimal('0.00')
        headroom = max(self.subtotal_amount - MIN_PAYABLE_AMOUNT, Decimal('0.00'))
        self.discount_amount = min(self.discount_amount, headroom)
        self.total_amount = self.subtotal_amount - self.discount_amount


class OrderParticipant(models.Model):
    """One person a booking covers — the buyer, or a friend they booked for.

    Every participant is a real `User`, because the fighter card the trainers
    read before a camp is per-user: someone the booking covers has to be able to
    log in and fill one in. A friend who has never used the site therefore gets
    an account provisioned at checkout — see `orders.participants`.

    `full_name` and `email` are snapshots of what the buyer typed, kept next to
    the FK so the booking still reads the way it was placed after the
    participant later edits their own profile.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='order_participations',
    )
    full_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField()
    #: The person who placed and paid for the order. Exactly one per order.
    is_buyer = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # One row per person per booking: nobody can be billed twice on the same
        # order, and the buyer cannot be re-added as their own guest.
        unique_together = ('order', 'user')
        # Buyer first, then the guests in the order they were added.
        ordering = ['-is_buyer', 'id']

    def __str__(self):
        return f"{self.email} on Order #{self.order_id}"

    @property
    def display_name(self):
        """Best available name: what the buyer typed, else the account's own."""
        return self.full_name or self.user.full_name or self.email


class ReminderKind(models.TextChoices):
    SEVEN_DAY = 'SEVEN_DAY', '7 days before start'
    ONE_DAY = 'ONE_DAY', '1 day before start'


class OrderReminder(models.Model):
    """One row per pre-arrival reminder actually sent to one participant.

    Recorded per participant, not per order: a booking for three people sends
    three reminders, and a send that fails for one of them must be retried for
    that person alone rather than re-sent to everyone.

    The unique constraint is what makes `send_package_reminders` safe to run
    repeatedly — a second run the same day, or a retry after a partial failure,
    cannot re-send a reminder someone already received.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='reminders')
    participant = models.ForeignKey(
        OrderParticipant, on_delete=models.CASCADE, related_name='reminders',
    )
    kind = models.CharField(max_length=20, choices=ReminderKind.choices)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('order', 'kind', 'participant')
        ordering = ['-sent_at']

    def __str__(self):
        return f"{self.get_kind_display()} for Order #{self.order_id}"
