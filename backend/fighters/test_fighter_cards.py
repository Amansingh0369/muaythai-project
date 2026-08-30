from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from locations.models import Location
from orders.models import Order, OrderStatus
from packages.models import Package
from users.models import Profile, User, UserRole

from . import constants as c
from .models import FighterCard


def complete_card_payload(**overrides):
    """Answers to every required question — a card that should come back complete."""
    payload = {
        'nationality': 'GB',
        'city': 'Manchester',
        'training_duration': c.TrainingDuration.ONE_TO_TWO_YEARS,
        'training_frequency': c.TrainingFrequency.THREE_DAYS,
        'trained_in_thailand': True,
        'thailand_trips': c.ThailandTrips.ONCE,
        'other_combat_sports': [c.CombatSport.BOXING, c.CombatSport.BJJ],
        'competition_experience': c.CompetitionExperience.MUAY_THAI,
        'fight_count': c.FightCount.TWO_TO_FIVE,
        'sparring_experience': c.SparringExperience.REGULARLY,
        'exercise_frequency': c.ExerciseFrequency.FOUR_DAYS,
        'cardio_level': c.CardioLevel.GOOD,
        'five_round_capability': c.FiveRoundCapability.YES_BUT_TIRED,
        'overall_fitness': 7,
        'goals': [c.Goal.IMPROVE_CLINCH, c.Goal.BUILD_ENDURANCE, c.Goal.IMPROVE_SPARRING],
        'primary_focus': c.PrimaryFocus.CLINCH,
        'fighting_styles': [c.FightingStyle.TECHNICAL, c.FightingStyle.PRESSURE_FIGHTER],
        'favourite_techniques': [c.FavouriteTechnique.KNEES, c.FavouriteTechnique.TEEP],
        'injury_status': c.InjuryStatus.NO,
        'has_past_major_injury': False,
        'training_restrictions': [c.TrainingRestriction.NO_RESTRICTIONS],
        'has_medical_condition': False,
        'coach_intensity': 8,
    }
    payload.update(overrides)
    return payload


class FighterCardTestBase(APITestCase):
    def setUp(self):
        self.fighter = User.objects.create_user(email='fighter@example.com', password='pass12345')
        self.other = User.objects.create_user(email='other@example.com', password='pass12345')
        self.admin = User.objects.create_user(
            email='admin@example.com', password='pass12345', role=UserRole.ADMIN,
        )
        self.camp = Location.objects.create(name='Sitmonchai', address='1 Camp Rd', city='Kanchanaburi')
        self.me_url = reverse('fighter-card-me')
        self.options_url = reverse('fighter-card-options')
        self.list_url = reverse('fighter-card-admin-list')

    def patch_me(self, payload):
        self.client.force_authenticate(user=self.fighter)
        return self.client.patch(self.me_url, payload, format='json')


class MyFighterCardTests(FighterCardTestBase):
    def test_requires_authentication(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_creates_the_card_on_first_read(self):
        self.client.force_authenticate(user=self.fighter)
        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(FighterCard.objects.filter(user=self.fighter).exists())
        self.assertFalse(response.data['is_complete'])
        self.assertIn('nationality', response.data['missing_fields'])

    def test_camp_is_taken_from_the_booking(self):
        package = Package.objects.create(
            name='2 Week Camp', description='...', price=Decimal('500.00'),
        )
        package.locations.add(self.camp)
        Order.objects.create(
            user=self.fighter, package=package, total_amount=Decimal('500.00'),
            status=OrderStatus.PAID,
        )

        self.client.force_authenticate(user=self.fighter)
        response = self.client.get(self.me_url)

        self.assertEqual(response.data['camp'], self.camp.id)
        self.assertEqual(response.data['camp_detail']['name'], 'Sitmonchai')

    def test_paid_booking_wins_over_pending_one(self):
        pending_camp = Location.objects.create(name='Other Gym', address='2 Rd', city='Phuket')
        paid_package = Package.objects.create(name='Paid', description='...', price=Decimal('500.00'))
        paid_package.locations.add(self.camp)
        pending_package = Package.objects.create(name='Pending', description='...', price=Decimal('500.00'))
        pending_package.locations.add(pending_camp)

        Order.objects.create(user=self.fighter, package=paid_package,
                             total_amount=Decimal('500.00'), status=OrderStatus.PAID)
        # Newer, but unpaid — the paid booking is still the one they are joining.
        Order.objects.create(user=self.fighter, package=pending_package,
                             total_amount=Decimal('500.00'), status=OrderStatus.PENDING)

        self.client.force_authenticate(user=self.fighter)
        self.assertEqual(self.client.get(self.me_url).data['camp'], self.camp.id)

    def test_partial_answers_are_saved(self):
        response = self.patch_me({'city': 'Leeds', 'cardio_level': c.CardioLevel.AVERAGE})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Leeds')
        self.assertFalse(response.data['is_complete'])

    def test_answering_everything_completes_the_card(self):
        response = self.patch_me(complete_card_payload())

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data['is_complete'])
        self.assertEqual(response.data['missing_fields'], [])
        self.assertIsNotNone(response.data['completed_at'])

    def test_completed_at_is_not_reset_by_later_edits(self):
        self.patch_me(complete_card_payload())
        completed_at = FighterCard.objects.get(user=self.fighter).completed_at

        self.patch_me({'city': 'Bristol'})

        self.assertEqual(FighterCard.objects.get(user=self.fighter).completed_at, completed_at)

    def test_a_fighter_only_ever_touches_their_own_card(self):
        FighterCard.objects.create(user=self.other, city='Berlin')

        self.patch_me({'city': 'Leeds'})

        self.assertEqual(FighterCard.objects.get(user=self.other).city, 'Berlin')


class MultiSelectRuleTests(FighterCardTestBase):
    def test_goals_are_capped_at_three(self):
        response = self.patch_me({'goals': [
            c.Goal.IMPROVE_CLINCH, c.Goal.BUILD_ENDURANCE,
            c.Goal.IMPROVE_SPARRING, c.Goal.LOSE_WEIGHT,
        ]})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('goals', response.data['data'])

    def test_styles_and_techniques_are_capped_at_two(self):
        for field, values in (
            ('fighting_styles', [c.FightingStyle.TECHNICAL, c.FightingStyle.AGGRESSIVE,
                                 c.FightingStyle.DEFENSIVE]),
            ('favourite_techniques', [c.FavouriteTechnique.JAB, c.FavouriteTechnique.TEEP,
                                      c.FavouriteTechnique.KNEES]),
        ):
            with self.subTest(field=field):
                response = self.patch_me({field: values})
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_none_cannot_be_combined_with_a_real_answer(self):
        response = self.patch_me({'other_combat_sports': [c.CombatSport.NONE, c.CombatSport.BOXING]})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('other_combat_sports', response.data['data'])

    def test_no_restrictions_cannot_be_combined_with_a_restriction(self):
        response = self.patch_me({'training_restrictions': [
            c.TrainingRestriction.NO_RESTRICTIONS, c.TrainingRestriction.RUNNING,
        ]})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_the_same_option_cannot_be_picked_twice(self):
        response = self.patch_me({'goals': [c.Goal.LOSE_WEIGHT, c.Goal.LOSE_WEIGHT]})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_codes_are_rejected(self):
        response = self.patch_me({'goals': ['BECOME_A_LEGEND']})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nationality_must_be_a_known_country(self):
        response = self.patch_me({'nationality': 'ZZ'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ScaleTests(FighterCardTestBase):
    def test_scales_reject_values_outside_one_to_ten(self):
        for field in ('overall_fitness', 'coach_intensity'):
            for value in (0, 11):
                with self.subTest(field=field, value=value):
                    response = self.patch_me({field: value})
                    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_scales_accept_the_bounds(self):
        response = self.patch_me({'overall_fitness': 1, 'coach_intensity': 10})

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ConditionalQuestionTests(FighterCardTestBase):
    def test_thailand_trips_requires_having_trained_there(self):
        response = self.patch_me({
            'trained_in_thailand': False, 'thailand_trips': c.ThailandTrips.ONCE,
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('thailand_trips', response.data['data'])

    def test_yes_to_thailand_requires_saying_how_many_times(self):
        response = self.patch_me({'trained_in_thailand': True})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('thailand_trips', response.data['data'])

    def test_changing_the_answer_clears_the_stale_follow_up(self):
        self.patch_me({'trained_in_thailand': True, 'thailand_trips': c.ThailandTrips.FOUR_PLUS})

        response = self.patch_me({'trained_in_thailand': False})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['thailand_trips'], '')

    def test_fight_count_requires_having_competed(self):
        response = self.patch_me({
            'competition_experience': c.CompetitionExperience.NEVER,
            'fight_count': c.FightCount.TEN_PLUS,
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_fight_count_stays_optional_for_someone_who_has_competed(self):
        response = self.patch_me({'competition_experience': c.CompetitionExperience.MMA})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_a_current_injury_needs_a_location(self):
        response = self.patch_me({'injury_status': c.InjuryStatus.YES_MODERATE})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('injury_areas', response.data['data'])

    def test_injury_areas_need_a_current_injury(self):
        response = self.patch_me({
            'injury_status': c.InjuryStatus.NO, 'injury_areas': [c.InjuryArea.KNEE],
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_prefer_to_discuss_does_not_demand_details(self):
        response = self.patch_me({'injury_status': c.InjuryStatus.PREFER_TO_DISCUSS})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_past_injury_types_follow_the_yes_no_answer(self):
        missing = self.patch_me({'has_past_major_injury': True})
        self.assertEqual(missing.status_code, status.HTTP_400_BAD_REQUEST)

        ok = self.patch_me({
            'has_past_major_injury': True,
            'past_injury_types': [c.PastInjuryType.LIGAMENT, c.PastInjuryType.SURGERY],
        })
        self.assertEqual(ok.status_code, status.HTTP_200_OK)

    def test_a_medical_condition_needs_details_for_the_trainer(self):
        missing = self.patch_me({'has_medical_condition': True})
        self.assertEqual(missing.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('medical_details', missing.data['data'])

        ok = self.patch_me({'has_medical_condition': True, 'medical_details': 'Asthma inhaler.'})
        self.assertEqual(ok.status_code, status.HTTP_200_OK)


class OptionsEndpointTests(FighterCardTestBase):
    def test_options_are_public_and_cover_every_choice_set(self):
        response = self.client.get(self.options_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['nationality']), 249)
        self.assertEqual(response.data['limits']['goals'], c.MAX_GOALS)
        self.assertEqual(
            {option['value'] for option in response.data['cardio_level']},
            set(c.CardioLevel.values),
        )
        self.assertIn('medical_details', response.data['private_fields'])


class AdminFighterCardTests(FighterCardTestBase):
    def setUp(self):
        super().setUp()
        self.card = FighterCard.objects.create(
            user=self.fighter, camp=self.camp, nationality='GB', city='Leeds',
            injury_status=c.InjuryStatus.YES_MINOR, injury_areas=[c.InjuryArea.KNEE],
            medical_details='Asthma inhaler.',
        )
        self.detail_url = reverse('fighter-card-admin-detail', args=[self.card.id])

    def test_a_fighter_cannot_read_the_roster(self):
        self.client.force_authenticate(user=self.fighter)

        self.assertEqual(self.client.get(self.list_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(self.detail_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_lists_cards_without_the_private_free_text(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = response.data[0]
        self.assertEqual(row['user_email'], 'fighter@example.com')
        self.assertTrue(row['has_injury'])
        self.assertNotIn('medical_details', row)
        self.assertNotIn('message_to_kru', row)

    def test_admin_detail_includes_the_private_section(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.detail_url)

        self.assertEqual(response.data['medical_details'], 'Asthma inhaler.')
        self.assertEqual(response.data['injury_areas'], [c.InjuryArea.KNEE])

    def test_admin_filters(self):
        elsewhere = Location.objects.create(name='Other Gym', address='2 Rd', city='Phuket')
        FighterCard.objects.create(user=self.other, camp=elsewhere, nationality='DE')
        self.client.force_authenticate(user=self.admin)

        by_camp = self.client.get(self.list_url, {'camp': self.camp.id})
        self.assertEqual([row['id'] for row in by_camp.data], [self.card.id])

        by_injury = self.client.get(self.list_url, {'has_injury': 'true'})
        self.assertEqual([row['id'] for row in by_injury.data], [self.card.id])

        by_search = self.client.get(self.list_url, {'search': 'other@'})
        self.assertEqual([row['user_email'] for row in by_search.data], ['other@example.com'])

        unfinished = self.client.get(self.list_url, {'is_complete': 'false'})
        self.assertEqual(len(unfinished.data), 2)

    def test_admin_can_correct_and_delete_a_card(self):
        self.client.force_authenticate(user=self.admin)

        patched = self.client.patch(self.detail_url, {'city': 'York'}, format='json')
        self.assertEqual(patched.status_code, status.HTTP_200_OK)
        self.assertEqual(patched.data['city'], 'York')

        deleted = self.client.delete(self.detail_url)
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(FighterCard.objects.filter(id=self.card.id).exists())

    def test_detail_carries_the_medical_notes_from_the_account_profile(self):
        profile = self.fighter.profile
        profile.medical_conditions = 'Type 1 diabetes.'
        profile.allergies = 'Penicillin.'
        profile.save()
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.data['profile_medical'], {
            'medical_conditions': 'Type 1 diabetes.', 'allergies': 'Penicillin.',
        })
        # The card's own answer stays alongside it rather than being replaced.
        self.assertEqual(response.data['medical_details'], 'Asthma inhaler.')

    def test_profile_medical_cannot_be_edited_through_the_card(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            self.detail_url,
            {'profile_medical': {'medical_conditions': 'Rewritten.', 'allergies': 'Rewritten.'}},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.fighter.profile.refresh_from_db()
        self.assertIn(self.fighter.profile.medical_conditions, (None, ''))

    def test_a_card_without_a_profile_still_loads(self):
        Profile.objects.filter(user=self.fighter).delete()
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['profile_medical'])

    def test_the_fighters_own_card_does_not_echo_the_profile(self):
        self.client.force_authenticate(user=self.fighter)

        response = self.client.get(self.me_url)

        self.assertNotIn('profile_medical', response.data)

    def test_cards_cannot_be_created_through_the_admin_endpoint(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(self.list_url, {'city': 'Leeds'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
