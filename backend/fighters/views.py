from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, permissions, response, views, viewsets

from core.permissions import IsAdmin

from . import constants as c
from .countries import COUNTRIES
from .models import FighterCard
from .serializers import (
    FighterCardAdminSerializer,
    FighterCardSerializer,
    FighterCardSummarySerializer,
)


def _choice_payload(choices):
    return [{'value': value, 'label': label} for value, label in choices]


class FighterCardOptionsView(views.APIView):
    """Every choice set the fighter card form needs, in one call.

    The form is built from this rather than from a copy of the options kept in
    the frontend, so adding an option is a backend change only and the codes
    the client posts can never drift from the ones the API accepts.
    """

    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={200: dict})
    def get(self, request):
        return response.Response({
            'nationality': _choice_payload(COUNTRIES),
            'training_duration': _choice_payload(c.TrainingDuration.choices),
            'training_frequency': _choice_payload(c.TrainingFrequency.choices),
            'thailand_trips': _choice_payload(c.ThailandTrips.choices),
            'other_combat_sports': _choice_payload(c.CombatSport.choices),
            'competition_experience': _choice_payload(c.CompetitionExperience.choices),
            'fight_count': _choice_payload(c.FightCount.choices),
            'sparring_experience': _choice_payload(c.SparringExperience.choices),
            'exercise_frequency': _choice_payload(c.ExerciseFrequency.choices),
            'cardio_level': _choice_payload(c.CardioLevel.choices),
            'five_round_capability': _choice_payload(c.FiveRoundCapability.choices),
            'goals': _choice_payload(c.Goal.choices),
            'primary_focus': _choice_payload(c.PrimaryFocus.choices),
            'fighting_styles': _choice_payload(c.FightingStyle.choices),
            'favourite_techniques': _choice_payload(c.FavouriteTechnique.choices),
            'injury_status': _choice_payload(c.InjuryStatus.choices),
            'injury_areas': _choice_payload(c.InjuryArea.choices),
            'past_injury_types': _choice_payload(c.PastInjuryType.choices),
            'training_restrictions': _choice_payload(c.TrainingRestriction.choices),
            'limits': {
                'goals': c.MAX_GOALS,
                'fighting_styles': c.MAX_FIGHTING_STYLES,
                'favourite_techniques': c.MAX_FAVOURITE_TECHNIQUES,
            },
            'exclusive_choices': {field: str(value) for field, value in c.EXCLUSIVE_CHOICES.items()},
            'scales': {
                'overall_fitness': {
                    'min': c.SCALE_MIN, 'max': c.SCALE_MAX,
                    'labels': {str(k): v for k, v in c.FITNESS_SCALE_LABELS.items()},
                },
                'coach_intensity': {
                    'min': c.SCALE_MIN, 'max': c.SCALE_MAX,
                    'labels': {str(k): v for k, v in c.INTENSITY_SCALE_LABELS.items()},
                },
            },
            'private_fields': list(FighterCard.PRIVATE_FIELDS),
            'required_for_completion': list(FighterCard.REQUIRED_FOR_COMPLETION),
        })


class MyFighterCardView(generics.RetrieveUpdateAPIView):
    """The signed-in fighter's own card.

    GET creates the card on first read instead of making the client POST an
    empty one, so the form always has something to PATCH into as the fighter
    works through it.
    """

    serializer_class = FighterCardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        card, _ = FighterCard.objects.get_or_create(
            user=self.request.user,
            defaults={'camp': FighterCard.camp_from_bookings(self.request.user)},
        )
        # A card started before the booking existed has no camp yet; fill it in
        # as soon as one can be derived, so the fighter is never asked again.
        if card.camp_id is None:
            camp = FighterCard.camp_from_bookings(self.request.user)
            if camp is not None:
                card.camp = camp
                card.save(update_fields=['camp'])
        return card


@extend_schema(parameters=[
    OpenApiParameter('camp', int, description='Only cards for this camp (location id).'),
    OpenApiParameter('is_complete', bool, description='Only complete, or only unfinished, cards.'),
    OpenApiParameter('has_injury', bool, description='Only fighters reporting a current injury.'),
    OpenApiParameter('nationality', str, description='ISO 3166-1 alpha-2 country code.'),
    OpenApiParameter('search', str, description='Match on email, name or city.'),
])
class FighterCardAdminViewSet(viewsets.ModelViewSet):
    """Admin/trainer view: read every fighter card, including the private section."""

    queryset = FighterCard.objects.select_related('user', 'user__profile', 'camp')
    serializer_class = FighterCardAdminSerializer
    permission_classes = [IsAdmin]
    http_method_names = ['get', 'patch', 'delete']

    def get_serializer_class(self):
        # A roster is scanned, a card is read: the list stays compact and the
        # private free text only travels on the detail response.
        if self.action == 'list':
            return FighterCardSummarySerializer
        return FighterCardAdminSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        camp = params.get('camp')
        if camp:
            queryset = queryset.filter(camp_id=camp)

        is_complete = params.get('is_complete')
        if is_complete is not None:
            queryset = queryset.filter(is_complete=is_complete.lower() in ('1', 'true', 'yes'))

        has_injury = params.get('has_injury')
        if has_injury is not None:
            if has_injury.lower() in ('1', 'true', 'yes'):
                queryset = queryset.filter(injury_status__in=c.INJURY_PRESENT_STATUSES)
            else:
                queryset = queryset.exclude(injury_status__in=c.INJURY_PRESENT_STATUSES)

        nationality = params.get('nationality')
        if nationality:
            queryset = queryset.filter(nationality__iexact=nationality)

        search = params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__email__icontains=search)
                | Q(user__full_name__icontains=search)
                | Q(city__icontains=search)
            )

        return queryset
