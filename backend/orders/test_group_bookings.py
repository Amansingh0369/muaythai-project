"""Bookings that cover more than one person.

Covers the checkout side (who a booking covers and what it therefore costs) and
the email side (everyone it covers hears about it, and hears the right thing).
"""
from datetime import timedelta
from decimal import Decimal
from unittest import mock

from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from coupons.models import Coupon, DiscountType
from fighters.models import FighterCard
from locations.models import Location
from orders.models import MAX_ORDER_PARTICIPANTS, Order, OrderReminder, OrderStatus, ReminderKind
from packages.models import Package, PackageType
from payments.models import Payment, PaymentStatus
from users.models import User


@override_settings(FRONTEND_URL='http://testserver')
class GroupBookingTestBase(APITestCase):
    def setUp(self):
        self.buyer = User.objects.create_user(
            email='buyer@example.com', password='pass12345', full_name='Anya Buyer',
        )
        self.camp = Location.objects.create(
            name='Sitmonchai', address='1 Camp Rd', city='Kanchanaburi',
        )
        self.package = Package.objects.create(
            name='Two Week Camp', type=PackageType.BEGINNER, description='Two weeks.',
            price=Decimal('20000.00'), duration_days=14,
            start_date=timezone.localdate() + timedelta(days=30),
        )
        self.package.locations.add(self.camp)
        self.list_url = reverse('order-list')

    def create_order(self, guests=None, **extra):
        self.client.force_authenticate(user=self.buyer)
        payload = {'package': self.package.id, **extra}
        if guests is not None:
            payload['guests'] = guests
        return self.client.post(self.list_url, payload, format='json')

    def participants_url(self, order_id):
        return reverse('order-update-participants', args=[order_id])


class OrderCreationTests(GroupBookingTestBase):
    def test_a_solo_booking_still_records_the_buyer_as_a_participant(self):
        response = self.create_order()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['participants']), 1)
        participant = response.data['participants'][0]
        self.assertTrue(participant['is_buyer'])
        self.assertEqual(participant['email'], 'buyer@example.com')
        self.assertEqual(Decimal(response.data['total_amount']), Decimal('20000.00'))

    def test_adding_a_friend_prices_the_booking_for_two(self):
        response = self.create_order([{'full_name': 'Ben Friend', 'email': 'ben@example.com'}])

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['subtotal_amount']), Decimal('40000.00'))
        self.assertEqual(Decimal(response.data['total_amount']), Decimal('40000.00'))
        self.assertEqual(response.data['participant_count'], 2)

    def test_the_buyer_is_listed_first(self):
        response = self.create_order([{'full_name': 'Ben Friend', 'email': 'ben@example.com'}])

        emails = [p['email'] for p in response.data['participants']]
        self.assertEqual(emails, ['buyer@example.com', 'ben@example.com'])

    def test_a_friend_without_an_account_gets_one_they_cannot_yet_sign_in_to(self):
        self.create_order([{'full_name': 'Ben Friend', 'email': 'Ben@Example.com'}])

        friend = User.objects.get(email='ben@example.com')
        self.assertEqual(friend.full_name, 'Ben Friend')
        self.assertFalse(friend.has_usable_password())
        self.assertFalse(friend.is_email_verified)

    def test_a_friend_who_already_has_an_account_keeps_their_own_name(self):
        existing = User.objects.create_user(
            email='ben@example.com', password='pass12345', full_name='Benjamin Ktm',
        )

        response = self.create_order([{'full_name': 'Ben', 'email': 'ben@example.com'}])

        existing.refresh_from_db()
        self.assertEqual(existing.full_name, 'Benjamin Ktm')
        self.assertEqual(User.objects.filter(email='ben@example.com').count(), 1)
        self.assertEqual(
            [p['user_id'] for p in response.data['participants']][1], existing.id,
        )

    def test_the_same_friend_cannot_be_added_twice(self):
        response = self.create_order([
            {'full_name': 'Ben', 'email': 'ben@example.com'},
            {'full_name': 'Ben again', 'email': 'BEN@example.com'},
        ])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('more than once', str(response.data['data']['guests']))

    def test_the_buyer_cannot_add_themselves_as_a_guest(self):
        response = self.create_order([{'full_name': 'Me', 'email': 'buyer@example.com'}])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already on this booking', str(response.data['data']['guests']))

    def test_a_booking_cannot_exceed_the_participant_cap(self):
        guests = [
            {'full_name': f'Friend {i}', 'email': f'friend{i}@example.com'}
            for i in range(MAX_ORDER_PARTICIPANTS)
        ]

        response = self.create_order(guests)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(str(MAX_ORDER_PARTICIPANTS), str(response.data['data']['guests']))
        # Nothing was provisioned for a booking that was never placed.
        self.assertEqual(User.objects.filter(email__startswith='friend').count(), 0)

    def test_a_client_cannot_dictate_its_own_price(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.post(self.list_url, {
            'package': self.package.id,
            'total_amount': '1.00',
            'guests': [{'full_name': 'Ben', 'email': 'ben@example.com'}],
        }, format='json')

        self.assertEqual(Decimal(response.data['total_amount']), Decimal('40000.00'))


class ParticipantUpdateTests(GroupBookingTestBase):
    def setUp(self):
        super().setUp()
        self.order = Order.objects.get(pk=self.create_order().data['id'])
        self.url = self.participants_url(self.order.id)

    def put_guests(self, guests, user=None):
        self.client.force_authenticate(user=user or self.buyer)
        return self.client.put(self.url, {'guests': guests}, format='json')

    def test_adding_a_friend_later_reprices_the_booking(self):
        response = self.put_guests([{'full_name': 'Ben', 'email': 'ben@example.com'}])

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.total_amount, Decimal('40000.00'))
        self.assertEqual(self.order.participant_count, 2)

    def test_removing_everyone_leaves_the_buyer_and_their_own_price(self):
        self.put_guests([{'full_name': 'Ben', 'email': 'ben@example.com'}])

        self.put_guests([])

        self.order.refresh_from_db()
        self.assertEqual(self.order.total_amount, Decimal('20000.00'))
        self.assertEqual(list(self.order.participants.values_list('is_buyer', flat=True)), [True])

    def test_changing_the_booking_invalidates_the_authorised_amount(self):
        self.order.razorpay_order_id = 'order_authorised_for_one'
        self.order.save(update_fields=['razorpay_order_id'])

        self.put_guests([{'full_name': 'Ben', 'email': 'ben@example.com'}])

        self.order.refresh_from_db()
        self.assertIsNone(self.order.razorpay_order_id)

    def test_a_coupon_that_no_longer_qualifies_is_dropped(self):
        coupon = Coupon.objects.create(
            code='GROUP10', discount_type=DiscountType.PERCENTAGE, value=Decimal('10'),
            min_order_amount=Decimal('40000.00'),
        )
        self.put_guests([{'full_name': 'Ben', 'email': 'ben@example.com'}])
        self.client.post(reverse('order-apply-coupon', args=[self.order.id]),
                         {'code': 'GROUP10'}, format='json')
        self.order.refresh_from_db()
        self.assertEqual(self.order.coupon, coupon)

        response = self.put_guests([])

        self.order.refresh_from_db()
        self.assertEqual(response.data['coupon_removed'], 'GROUP10')
        self.assertIsNone(self.order.coupon)
        self.assertEqual(self.order.total_amount, Decimal('20000.00'))

    def test_a_coupon_is_measured_against_the_whole_booking(self):
        Coupon.objects.create(
            code='GROUP10', discount_type=DiscountType.PERCENTAGE, value=Decimal('10'),
            min_order_amount=Decimal('40000.00'),
        )
        self.put_guests([{'full_name': 'Ben', 'email': 'ben@example.com'}])

        self.client.force_authenticate(user=self.buyer)
        response = self.client.post(reverse('order-apply-coupon', args=[self.order.id]),
                                    {'code': 'GROUP10'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['discount_amount']), Decimal('4000.00'))
        self.assertEqual(Decimal(response.data['total_amount']), Decimal('36000.00'))

    def test_a_paid_booking_cannot_change_who_it_covers(self):
        self.order.status = OrderStatus.PAID
        self.order.save(update_fields=['status'])

        response = self.put_guests([{'full_name': 'Ben', 'email': 'ben@example.com'}])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ParticipantAccessTests(GroupBookingTestBase):
    def setUp(self):
        super().setUp()
        self.order = Order.objects.get(pk=self.create_order(
            [{'full_name': 'Ben', 'email': 'ben@example.com'}]).data['id'])
        self.friend = User.objects.get(email='ben@example.com')
        self.stranger = User.objects.create_user(
            email='stranger@example.com', password='pass12345')

    def test_a_friend_sees_the_booking_they_are_on(self):
        self.client.force_authenticate(user=self.friend)
        response = self.client.get(reverse('order-list-my'))

        self.assertEqual([order['id'] for order in response.data], [self.order.id])

    def test_a_stranger_sees_nothing(self):
        self.client.force_authenticate(user=self.stranger)
        response = self.client.get(reverse('order-list-my'))

        self.assertEqual(response.data, [])

    def test_a_friend_cannot_cancel_a_booking_they_did_not_pay_for(self):
        self.client.force_authenticate(user=self.friend)
        response = self.client.post(reverse('order-cancel', args=[self.order.id]))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, OrderStatus.PENDING)

    def test_a_friend_cannot_change_who_the_booking_covers(self):
        self.client.force_authenticate(user=self.friend)
        response = self.client.put(
            self.participants_url(self.order.id), {'guests': []}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.order.participants.count(), 2)

    def test_a_friend_cannot_apply_a_coupon(self):
        Coupon.objects.create(
            code='TEN', discount_type=DiscountType.PERCENTAGE, value=Decimal('10'))
        self.client.force_authenticate(user=self.friend)

        response = self.client.post(reverse('order-apply-coupon', args=[self.order.id]),
                                    {'code': 'TEN'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ConfirmationEmailTests(GroupBookingTestBase):
    def setUp(self):
        super().setUp()
        self.order = Order.objects.get(pk=self.create_order(
            [{'full_name': 'Ben Friend', 'email': 'ben@example.com'}]).data['id'])
        self.friend = User.objects.get(email='ben@example.com')
        self.payment = Payment.objects.create(
            order=self.order, razorpay_order_id='order_x', razorpay_payment_id='pay_x',
            amount=self.order.total_amount, status=PaymentStatus.SUCCESS,
        )
        mail.outbox = []

    def send(self):
        from orders.emails import send_order_confirmation_emails
        return send_order_confirmation_emails(order=self.order, payment=self.payment)

    def sent_to(self, address):
        return next(m for m in mail.outbox if address in m.to)

    def test_everyone_on_the_booking_is_emailed(self):
        sent = self.send()

        self.assertEqual(sent, 2)
        self.assertEqual(
            sorted(address for message in mail.outbox for address in message.to),
            ['ben@example.com', 'buyer@example.com'],
        )

    def test_the_buyer_gets_the_receipt(self):
        self.send()
        body = self.sent_to('buyer@example.com').body

        self.assertIn('40,000', body)
        self.assertIn('pay_x', body)
        self.assertIn('2 fighters', body)

    def test_a_friend_is_not_told_what_someone_else_paid(self):
        self.send()
        message = self.sent_to('ben@example.com')

        self.assertIn('Anya Buyer', message.body)
        self.assertNotIn('40,000', message.body)
        self.assertNotIn('pay_x', message.body)

    def test_an_incomplete_fighter_card_is_flagged(self):
        self.send()

        for address in ('buyer@example.com', 'ben@example.com'):
            self.assertIn('fighter card', self.sent_to(address).body.lower())

    def test_a_complete_fighter_card_is_not_nagged_about(self):
        card = FighterCard.objects.create(user=self.buyer)
        with mock.patch.object(FighterCard, 'missing_fields', []):
            card.save()
            self.send()

        self.assertNotIn('fighter card', self.sent_to('buyer@example.com').body.lower())
        self.assertIn('fighter card', self.sent_to('ben@example.com').body.lower())

    def test_a_friend_with_no_password_is_sent_a_way_to_set_one(self):
        self.send()

        self.assertIn('/reset-password?token=', self.sent_to('ben@example.com').body)

    def test_a_friend_who_can_already_sign_in_is_sent_to_their_card(self):
        self.friend.set_password('pass12345')
        self.friend.save(update_fields=['password'])

        self.send()

        body = self.sent_to('ben@example.com').body
        self.assertNotIn('/reset-password', body)
        self.assertIn('/profile/fighter-card', body)

    def test_one_bad_address_does_not_cost_the_others_their_email(self):
        with mock.patch('core.emails.EmailMultiAlternatives.send') as send:
            send.side_effect = [OSError('smtp refused'), None]
            sent = self.send()

        self.assertEqual(sent, 1)


class ReminderTests(GroupBookingTestBase):
    def setUp(self):
        super().setUp()
        self.order = Order.objects.get(pk=self.create_order(
            [{'full_name': 'Ben Friend', 'email': 'ben@example.com'}]).data['id'])
        self.order.status = OrderStatus.PAID
        self.order.start_date = timezone.localdate() + timedelta(days=7)
        self.order.save(update_fields=['status', 'start_date'])
        mail.outbox = []

    def run_command(self):
        from django.core.management import call_command
        call_command('send_package_reminders', verbosity=0)

    def test_every_participant_is_reminded(self):
        self.run_command()

        self.assertEqual(
            sorted(address for message in mail.outbox for address in message.to),
            ['ben@example.com', 'buyer@example.com'],
        )
        self.assertEqual(self.order.reminders.count(), 2)

    def test_a_second_run_reminds_nobody_twice(self):
        self.run_command()
        mail.outbox = []

        self.run_command()

        self.assertEqual(mail.outbox, [])

    def test_a_failure_for_one_participant_is_retried_for_them_alone(self):
        with mock.patch('core.emails.EmailMultiAlternatives.send') as send:
            send.side_effect = [None, OSError('smtp refused')]
            self.run_command()

        self.assertEqual(
            list(self.order.reminders.values_list('participant__email', flat=True)),
            ['buyer@example.com'],
        )

        mail.outbox = []
        self.run_command()

        self.assertEqual(
            [address for message in mail.outbox for address in message.to],
            ['ben@example.com'],
        )

    def test_a_reminder_kind_is_recorded_per_participant(self):
        self.run_command()

        self.assertEqual(
            set(self.order.reminders.values_list('kind', flat=True)),
            {ReminderKind.SEVEN_DAY},
        )
        self.assertEqual(
            OrderReminder.objects.filter(kind=ReminderKind.SEVEN_DAY).count(), 2)


class FighterCardCampTests(GroupBookingTestBase):
    def test_a_friend_inherits_the_camp_from_the_booking_made_for_them(self):
        self.create_order([{'full_name': 'Ben', 'email': 'ben@example.com'}])
        friend = User.objects.get(email='ben@example.com')

        self.assertEqual(FighterCard.camp_from_bookings(friend), self.camp)


class SerializerGuardTests(GroupBookingTestBase):
    def test_guests_cannot_ride_in_on_a_plain_update(self):
        order = Order.objects.get(pk=self.create_order().data['id'])
        admin = User.objects.create_user(
            email='admin@example.com', password='pass12345', role='ADMIN')
        self.client.force_authenticate(user=admin)

        response = self.client.patch(
            reverse('order-detail', args=[order.id]),
            {'guests': [{'full_name': 'Ben', 'email': 'ben@example.com'}]},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('participants/', str(response.data['data']['guests']))
        self.assertEqual(order.participants.count(), 1)


class ProfileBookingsTests(GroupBookingTestBase):
    """`/api/users/me/` is where a fighter finds the camp they are joining."""

    def setUp(self):
        super().setUp()
        self.create_order([{'full_name': 'Ben Friend', 'email': 'ben@example.com'}])
        self.friend = User.objects.get(email='ben@example.com')
        self.me_url = reverse('user-profile')

    def get_me(self, user):
        self.client.force_authenticate(user=user)
        return self.client.get(self.me_url)

    def test_a_friend_sees_the_booking_made_for_them(self):
        orders = self.get_me(self.friend).data['orders']

        self.assertEqual(len(orders), 1)
        self.assertFalse(orders[0]['is_buyer'])
        self.assertEqual(orders[0]['participant_count'], 2)

    def test_a_friend_is_not_shown_what_the_booking_cost(self):
        orders = self.get_me(self.friend).data['orders']

        self.assertIsNone(orders[0]['total_amount'])

    def test_the_buyer_still_sees_their_own_receipt(self):
        orders = self.get_me(self.buyer).data['orders']

        self.assertTrue(orders[0]['is_buyer'])
        self.assertEqual(Decimal(orders[0]['total_amount']), Decimal('40000.00'))


class InvitedAccountTests(GroupBookingTestBase):
    """The account a friend never asked for still has to become usable."""

    def setUp(self):
        super().setUp()
        self.create_order([{'full_name': 'Ben Friend', 'email': 'ben@example.com'}])
        self.friend = User.objects.get(email='ben@example.com')

    def test_an_invited_friend_can_claim_their_account_and_sign_in(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        confirm = self.client.post(reverse('password_reset_confirm'), {
            'uid': urlsafe_base64_encode(force_bytes(self.friend.pk)),
            'token': default_token_generator.make_token(self.friend),
            'new_password': 'chosen-pass-123',
            'confirm_password': 'chosen-pass-123',
        }, format='json')
        self.assertEqual(confirm.status_code, status.HTTP_200_OK)

        login = self.client.post(reverse('login'), {
            'email': 'ben@example.com', 'password': 'chosen-pass-123',
        }, format='json')

        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_the_invite_link_stops_working_once_it_has_been_used(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.friend.pk))
        token = default_token_generator.make_token(self.friend)
        payload = {'uid': uid, 'token': token,
                   'new_password': 'chosen-pass-123', 'confirm_password': 'chosen-pass-123'}
        self.client.post(reverse('password_reset_confirm'), payload, format='json')

        replay = self.client.post(reverse('password_reset_confirm'), payload, format='json')

        self.assertEqual(replay.status_code, status.HTTP_400_BAD_REQUEST)
