from smtplib import SMTPException
from unittest import mock

from django.core import mail
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from fighters import constants as fc
from fighters.models import FighterCard
from locations.models import Location

from .models import ProfileShare, User, UserRole


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class ProfileSharingTestBase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com', password='pass12345',
            role=UserRole.ADMIN, full_name='Admin Person',
        )
        self.customer = User.objects.create_user(
            email='customer@example.com', password='pass12345', full_name='Somchai Fighter',
        )
        self.other_user = User.objects.create_user(email='other@example.com', password='pass12345')
        self.camp = Location.objects.create(
            name='Sitmonchai', address='1 Camp Rd', city='Kanchanaburi',
        )

        self.share_url = reverse('user-admin-share', args=[self.customer.pk])
        self.preview_url = reverse('user-admin-share-preview', args=[self.customer.pk])
        self.shares_url = reverse('user-admin-shares', args=[self.customer.pk])

    def add_profile_details(self):
        profile = self.customer.profile
        profile.age = 29
        profile.phone = '+66 555 0100'
        profile.passport = 'X1234567'
        profile.medical_conditions = 'Mild asthma'
        profile.allergies = 'Peanuts'
        profile.emergency_contact_name = 'Malee'
        profile.emergency_contact_phone = '+66 555 0199'
        profile.save()
        return profile

    def add_fighter_card(self):
        return FighterCard.objects.create(
            user=self.customer, camp=self.camp,
            nationality='GB', city='Manchester',
            training_duration=fc.TrainingDuration.ONE_TO_TWO_YEARS,
            goals=[fc.Goal.IMPROVE_CLINCH, fc.Goal.BUILD_ENDURANCE],
            injury_status=fc.InjuryStatus.YES_MODERATE,
            injury_notes='Left shoulder, six weeks ago',
            has_medical_condition=True,
            medical_details='Asthma inhaler before sessions',
            message_to_kru='Please go easy on the left arm',
            coach_intensity=8,
        )


class SharePermissionTests(ProfileSharingTestBase):
    def test_anonymous_cannot_share(self):
        response = self.client.post(self.share_url, {'email': 'coach@camp.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(len(mail.outbox), 0)

    def test_a_customer_cannot_share_their_own_profile(self):
        # The dossier is a staff-facing record, not something the customer sends on.
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(self.share_url, {'email': 'coach@camp.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(len(mail.outbox), 0)

    def test_a_customer_cannot_share_someone_elses_profile(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.post(self.share_url, {'email': 'coach@camp.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(len(mail.outbox), 0)

    def test_non_admin_cannot_preview_or_read_the_share_history(self):
        self.client.force_authenticate(user=self.customer)
        self.assertEqual(
            self.client.get(self.preview_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            self.client.get(self.shares_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_allowing_post_for_sharing_does_not_expose_user_creation(self):
        # The share action needs POST on this viewset; account creation must
        # still go through /api/auth/register/ only.
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse('user-admin-list'),
            {'email': 'sneaky@example.com', 'password': 'pass12345'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertFalse(User.objects.filter(email='sneaky@example.com').exists())


class ShareProfileTests(ProfileSharingTestBase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_share_sends_one_email_to_the_given_address(self):
        response = self.client.post(
            self.share_url, {'email': 'coach@camp.com'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['coach@camp.com'])

    def test_the_subject_identifies_the_customer(self):
        self.client.post(self.share_url, {'email': 'coach@camp.com'}, format='json')
        self.assertIn('Somchai Fighter', mail.outbox[0].subject)

    def test_the_email_carries_the_profile_and_the_fighter_card(self):
        self.add_profile_details()
        self.add_fighter_card()

        self.client.post(self.share_url, {'email': 'coach@camp.com'}, format='json')
        body = mail.outbox[0].body

        self.assertIn('+66 555 0100', body)                  # profile
        self.assertIn('X1234567', body)                      # passport
        self.assertIn('Malee', body)                         # emergency contact
        self.assertIn('Manchester', body)                    # fighter card
        self.assertIn('Left shoulder, six weeks ago', body)  # private section

    def test_no_booking_or_payment_details_are_ever_shared(self):
        # The dossier describes the fighter, not their transactions with us.
        self.add_profile_details()
        self.add_fighter_card()

        self.client.post(self.share_url, {'email': 'coach@camp.com'}, format='json')
        body = mail.outbox[0].body

        for absent in ('Booking', 'Payment', 'Package', 'Amount', '₹'):
            self.assertNotIn(absent, body)

    def test_codes_are_rendered_as_human_labels(self):
        self.add_fighter_card()
        self.client.post(self.share_url, {'email': 'coach@camp.com'}, format='json')
        body = mail.outbox[0].body

        # The reader is a coach, not an API client: no raw enum codes.
        self.assertIn(str(fc.Goal.IMPROVE_CLINCH.label), body)
        self.assertNotIn('IMPROVE_CLINCH', body)
        self.assertIn('United Kingdom', body)

    def test_a_note_is_included_for_the_recipient(self):
        self.client.post(
            self.share_url,
            {'email': 'coach@camp.com', 'note': 'Arriving Tuesday, please review the shoulder.'},
            format='json',
        )
        self.assertIn('Arriving Tuesday', mail.outbox[0].body)

    def test_sections_limit_what_is_sent(self):
        self.add_profile_details()
        self.add_fighter_card()

        self.client.post(
            self.share_url,
            {'email': 'coach@camp.com', 'sections': ['fighter_card']},
            format='json',
        )
        body = mail.outbox[0].body

        self.assertIn('Manchester', body)
        # The whole point of sections: the passport stays behind.
        self.assertNotIn('X1234567', body)

    def test_a_missing_fighter_card_is_stated_rather_than_erroring(self):
        response = self.client.post(
            self.share_url, {'email': 'coach@camp.com'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('has not started a fighter card', mail.outbox[0].body)

    def test_an_invalid_email_is_rejected_and_nothing_is_sent(self):
        response = self.client.post(self.share_url, {'email': 'not-an-email'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(ProfileShare.objects.exists())

    def test_an_unknown_section_is_rejected(self):
        response = self.client.post(
            self.share_url,
            {'email': 'coach@camp.com', 'sections': ['fighter_card', 'payment']},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(len(mail.outbox), 0)

    def test_a_failed_send_reports_the_failure_and_records_nothing(self):
        # A share that never left must not appear in the audit trail as if it had.
        with mock.patch(
            'users.views.send_profile_dossier_email', side_effect=SMTPException('no route'),
        ):
            with self.assertLogs('users.views', level='ERROR'):
                response = self.client.post(
                    self.share_url, {'email': 'coach@camp.com'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertFalse(ProfileShare.objects.exists())


class ShareAuditTrailTests(ProfileSharingTestBase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_a_successful_share_is_recorded(self):
        self.client.post(
            self.share_url,
            {'email': 'coach@camp.com', 'sections': ['fighter_card'], 'note': 'FYI'},
            format='json',
        )

        share = ProfileShare.objects.get()
        self.assertEqual(share.user, self.customer)
        self.assertEqual(share.shared_by, self.admin)
        self.assertEqual(share.recipient_email, 'coach@camp.com')
        self.assertEqual(share.sections, ['fighter_card'])
        self.assertEqual(share.note, 'FYI')

    def test_a_share_with_no_sections_given_records_all_of_them(self):
        self.client.post(self.share_url, {'email': 'coach@camp.com'}, format='json')

        share = ProfileShare.objects.get()
        self.assertEqual(share.sections, ['customer', 'fighter_card'])

    def test_the_history_lists_previous_shares_newest_first(self):
        self.client.post(self.share_url, {'email': 'first@camp.com'}, format='json')
        self.client.post(self.share_url, {'email': 'second@camp.com'}, format='json')

        response = self.client.get(self.shares_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [row['recipient_email'] for row in response.data],
            ['second@camp.com', 'first@camp.com'],
        )
        self.assertEqual(response.data[0]['shared_by_email'], 'admin@example.com')

    def test_the_history_is_scoped_to_the_customer(self):
        self.client.post(self.share_url, {'email': 'coach@camp.com'}, format='json')

        response = self.client.get(reverse('user-admin-shares', args=[self.other_user.pk]))

        self.assertEqual(response.data, [])


class SharePreviewTests(ProfileSharingTestBase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_preview_returns_every_section_without_sending_anything(self):
        response = self.client.get(self.preview_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [section['key'] for section in response.data['sections']],
            ['customer', 'fighter_card'],
        )
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(ProfileShare.objects.exists())

    def test_preview_can_be_narrowed_to_chosen_sections(self):
        response = self.client.get(self.preview_url, {'sections': 'fighter_card'})

        self.assertEqual(
            [section['key'] for section in response.data['sections']],
            ['fighter_card'],
        )

    def test_preview_shows_the_values_that_would_be_sent(self):
        self.add_profile_details()

        response = self.client.get(self.preview_url, {'sections': 'customer'})
        rows = [row for block in response.data['sections'][0]['blocks'] for row in block['rows']]
        values = [row['value'] for row in rows]

        self.assertIn('X1234567', values)
        self.assertIn('Peanuts', values)

    def test_preview_rejects_an_unknown_section(self):
        response = self.client.get(self.preview_url, {'sections': 'customer,order'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('order', response.data['error'])

    def test_unanswered_card_questions_are_labelled_not_answered(self):
        FighterCard.objects.create(user=self.customer)

        response = self.client.get(self.preview_url, {'sections': 'fighter_card'})
        rows = [row for block in response.data['sections'][0]['blocks'] for row in block['rows']]
        city = next(row for row in rows if row['label'] == 'City')

        self.assertEqual(city['value'], 'Not answered')
