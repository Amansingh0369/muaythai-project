"""Pricing a coupon before an order exists.

The preview endpoint is what the checkout screen shows the customer, so its
arithmetic has to agree with `Order.recalculate_totals` — a preview that
promises one number and an order that charges another is worse than no preview.
"""
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from coupons.models import Coupon, DiscountType
from orders.models import MAX_ORDER_PARTICIPANTS, Order
from packages.models import Package, PackageType
from users.models import User


class CouponPreviewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='buyer@example.com', password='pass12345', full_name='Anya Buyer',
        )
        self.client.force_authenticate(user=self.user)
        self.package = Package.objects.create(
            name='Two Week Camp', type=PackageType.BEGINNER, description='Two weeks.',
            price=Decimal('20000.00'), duration_days=14,
        )
        self.url = reverse('coupon-preview')

    def preview(self, **extra):
        return self.client.post(
            self.url, {'code': 'TEST2', 'package_id': self.package.id, **extra},
            format='json',
        )

    def fixed(self, value):
        return Coupon.objects.create(
            code='TEST2', discount_type=DiscountType.FIXED, value=Decimal(value))

    def test_a_solo_booking_is_priced_at_the_package_price(self):
        self.fixed('5000.00')

        data = self.preview().data

        self.assertEqual(Decimal(data['subtotal_amount']), Decimal('20000.00'))
        self.assertEqual(Decimal(data['discount_amount']), Decimal('5000.00'))
        self.assertEqual(Decimal(data['total_amount']), Decimal('15000.00'))

    def test_a_group_booking_is_priced_for_everyone_it_covers(self):
        """The bug: a group of three was previewed against one person's price."""
        self.fixed('5000.00')

        data = self.preview(participant_count=3).data

        self.assertEqual(Decimal(data['subtotal_amount']), Decimal('60000.00'))
        self.assertEqual(Decimal(data['discount_amount']), Decimal('5000.00'))
        self.assertEqual(Decimal(data['total_amount']), Decimal('55000.00'))

    def test_a_percentage_coupon_scales_with_the_group(self):
        Coupon.objects.create(
            code='TEST2', discount_type=DiscountType.PERCENTAGE, value=Decimal('10.00'))

        data = self.preview(participant_count=2).data

        self.assertEqual(Decimal(data['subtotal_amount']), Decimal('40000.00'))
        self.assertEqual(Decimal(data['discount_amount']), Decimal('4000.00'))

    def test_the_preview_matches_what_the_order_will_charge(self):
        coupon = self.fixed('5000.00')

        data = self.preview(participant_count=2).data

        order = Order.objects.create(
            user=self.user, package=self.package, coupon=coupon, total_amount=0)
        for index in range(2):
            order.participants.create(
                user=self.user if index == 0 else User.objects.create_user(
                    email=f'friend{index}@example.com', full_name='Friend'),
                full_name='Fighter', email=f'p{index}@example.com', is_buyer=index == 0)
        order.recalculate_totals()

        self.assertEqual(Decimal(data['subtotal_amount']), order.subtotal_amount)
        self.assertEqual(Decimal(data['discount_amount']), order.discount_amount)
        self.assertEqual(Decimal(data['total_amount']), order.total_amount)

    def test_a_minimum_order_is_measured_against_the_whole_booking(self):
        """Two people genuinely spend twice as much, so the minimum is met."""
        Coupon.objects.create(
            code='TEST2', discount_type=DiscountType.FIXED, value=Decimal('1000.00'),
            min_order_amount=Decimal('30000.00'))

        self.assertEqual(self.preview().status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.preview(participant_count=2).status_code, status.HTTP_200_OK)

    def test_an_omitted_count_is_treated_as_one_person(self):
        self.fixed('5000.00')

        self.assertEqual(
            self.preview().data['subtotal_amount'],
            self.preview(participant_count=1).data['subtotal_amount'])

    def test_a_count_outside_what_checkout_allows_is_rejected(self):
        self.fixed('5000.00')

        for bad in (0, -1, MAX_ORDER_PARTICIPANTS + 1, 'two'):
            with self.subTest(participant_count=bad):
                response = self.preview(participant_count=bad)
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_the_preview_creates_nothing(self):
        self.fixed('5000.00')

        self.preview(participant_count=3)

        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(Coupon.objects.get(code='TEST2').times_redeemed, 0)
