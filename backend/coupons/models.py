from decimal import ROUND_HALF_UP, Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

TWO_PLACES = Decimal('0.01')


class DiscountType(models.TextChoices):
    PERCENTAGE = 'PERCENTAGE', 'Percentage off'
    FIXED = 'FIXED', 'Fixed amount off'


# The fields that define what a code is worth. Once any order references the
# coupon these are frozen: an order stores its discount at the moment it is
# applied, so editing them afterwards either leaves pending orders holding terms
# you no longer offer, or — for `code` — makes a paid order report a code the
# customer never typed. Availability fields (is_active, validity window,
# max_redemptions) stay editable, since those only affect future applications.
LOCKED_ONCE_USED = (
    'code', 'discount_type', 'value', 'max_discount_amount', 'min_order_amount',
)

LOCKED_MESSAGE = (
    'This coupon has already been used on an order, so its discount terms are '
    'locked. Deactivate it and create a new coupon instead.'
)


class Coupon(models.Model):
    """A global discount code.

    Global means any authenticated customer who knows the code can use it —
    there is no per-user allocation. `max_redemptions` is the only supply
    control, so treat codes as public the moment they are shared.
    """
    code = models.CharField(
        max_length=32, unique=True, db_index=True,
        help_text='Case-insensitive; stored and matched in upper case.',
    )
    description = models.CharField(max_length=255, blank=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    value = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))],
        help_text='Percent (1-100) for PERCENTAGE, rupees for FIXED.',
    )
    # Caps a percentage discount, e.g. "20% off, up to ₹5,000".
    max_discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text='Optional ceiling on the discount. Percentage coupons only.',
    )
    min_order_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text='Optional minimum order value before the coupon applies.',
    )
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    max_redemptions = models.PositiveIntegerField(
        null=True, blank=True, help_text='Leave empty for unlimited.',
    )
    # Counted when a payment succeeds, not when a coupon is applied — see
    # `orders.views.apply_coupon` for why a pending order does not hold supply.
    times_redeemed = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        suffix = '%' if self.discount_type == DiscountType.PERCENTAGE else ' off'
        return f'{self.code} ({self.value}{suffix})'

    def save(self, *args, **kwargs):
        # Normalising here (rather than only in the serializer) keeps admin and
        # shell-created coupons matchable by the same lookup customers use.
        self.code = self.code.strip().upper()
        return super().save(*args, **kwargs)

    def clean(self):
        # Covers the Django admin and any ModelForm; the DRF serializer runs the
        # same rule for API callers.
        if self.pk:
            previous = Coupon.objects.filter(pk=self.pk).first()
            if previous and previous.is_used:
                changed = self.locked_field_changes(previous)
                if changed:
                    raise ValidationError({field: LOCKED_MESSAGE for field in changed})

        if self.discount_type == DiscountType.PERCENTAGE and self.value > 100:
            raise ValidationError({'value': 'A percentage discount cannot exceed 100.'})
        if self.discount_type == DiscountType.FIXED and self.max_discount_amount:
            raise ValidationError({
                'max_discount_amount': 'A cap only applies to percentage coupons.',
            })
        if self.valid_from and self.valid_until and self.valid_from >= self.valid_until:
            raise ValidationError({'valid_until': 'Must be later than valid_from.'})

    @property
    def is_exhausted(self):
        return self.max_redemptions is not None and self.times_redeemed >= self.max_redemptions

    @property
    def is_used(self):
        """Whether any order references this coupon.

        Deliberately not `times_redeemed > 0` — that only counts *paid*
        redemptions, so a coupon sitting on an unpaid pending order reads as
        unused while its terms are already promised to someone.
        """
        return self.pk is not None and self.orders.exists()

    def locked_field_changes(self, previous):
        """Which frozen fields this instance changes relative to `previous`."""
        return [f for f in LOCKED_ONCE_USED if getattr(self, f) != getattr(previous, f)]

    def unusable_reason(self, subtotal, *, now=None):
        """Why this coupon cannot be used against `subtotal`, or None if it can.

        Returns customer-facing text — these strings are surfaced by the API.
        """
        now = now or timezone.now()
        if not self.is_active:
            return 'This coupon is no longer active.'
        if self.valid_from and now < self.valid_from:
            return 'This coupon is not valid yet.'
        if self.valid_until and now > self.valid_until:
            return 'This coupon has expired.'
        if self.is_exhausted:
            return 'This coupon has reached its redemption limit.'
        if self.min_order_amount and subtotal < self.min_order_amount:
            return f'This coupon requires a minimum order of ₹{self.min_order_amount:,.0f}.'
        return None

    def compute_discount(self, subtotal):
        """The rupee discount this coupon gives on `subtotal`.

        Never exceeds the subtotal, so a large fixed-amount coupon zeroes an
        order rather than producing a negative total.
        """
        subtotal = Decimal(subtotal)
        if self.discount_type == DiscountType.PERCENTAGE:
            discount = subtotal * self.value / Decimal('100')
            if self.max_discount_amount is not None:
                discount = min(discount, self.max_discount_amount)
        else:
            discount = self.value
        discount = min(discount, subtotal)
        return discount.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
