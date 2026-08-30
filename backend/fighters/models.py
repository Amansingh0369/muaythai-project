from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.fields.files import FieldFile
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.utils import timezone

from locations.models import Location

from . import constants as c
from .countries import COUNTRIES


class FighterCard(models.Model):
    """A fighter's training profile, filled in before they arrive at a camp.

    One card per user rather than one per booking: the answers describe the
    fighter, not the trip, so a returning customer updates the card they
    already have instead of re-answering forty questions. `camp` records which
    camp the card is currently pointed at and moves with the latest booking.

    Every question is optional at the database level — the form is long and is
    filled in over several sittings, so a partially answered card must be
    saveable. `is_complete` is what tells the trainers a card is ready to read;
    the cross-field rules (a follow-up answer without its trigger, a fourth
    goal) are enforced in the serializer, where they can be reported per field.
    """

    #: Answers that must all be present before a card counts as complete.
    #: `camp` is excluded: it comes from the booking, not from the fighter.
    REQUIRED_FOR_COMPLETION = (
        'photo', 'nationality', 'city',
        'training_duration', 'training_frequency', 'trained_in_thailand',
        'other_combat_sports', 'competition_experience', 'sparring_experience',
        'exercise_frequency', 'cardio_level', 'five_round_capability', 'overall_fitness',
        'goals', 'primary_focus', 'fighting_styles', 'favourite_techniques',
        'injury_status', 'has_past_major_injury', 'training_restrictions',
        'has_medical_condition', 'coach_intensity',
    )

    #: The "Private / Trainer Only" section. Only ever served to the fighter
    #: themselves and to staff, and left out of the admin roster listing —
    #: see `FighterCardSummarySerializer`.
    PRIVATE_FIELDS = (
        'injury_status', 'injury_areas', 'injury_notes',
        'has_past_major_injury', 'past_injury_types',
        'training_restrictions', 'training_restrictions_notes',
        'has_medical_condition', 'medical_details',
        'coach_intensity', 'train_around_limitations', 'message_to_kru',
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fighter_card',
    )
    # Which Thailand camp the fighter is joining. Normally filled in from the
    # booking (see `camp_from_bookings`); kept editable because a card can be
    # started before the order exists.
    camp = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='fighter_cards',
    )

    # --- Basic profile ---------------------------------------------------
    # Required for completion, but still nullable: like every other answer it
    # is filled in partway through, so a card without one has to be saveable.
    # Written through `/me/photo/` rather than the card endpoint — see
    # `FighterCardPhotoSerializer`.
    photo = models.ImageField(upload_to='fighter-cards/', null=True, blank=True)
    # ISO 3166-1 alpha-2; the frontend renders names from the options endpoint.
    nationality = models.CharField(max_length=2, choices=COUNTRIES, blank=True)
    city = models.CharField(max_length=100, blank=True)

    # --- Training background ---------------------------------------------
    training_duration = models.CharField(max_length=32, choices=c.TrainingDuration.choices, blank=True)
    training_frequency = models.CharField(max_length=32, choices=c.TrainingFrequency.choices, blank=True)
    trained_in_thailand = models.BooleanField(null=True, blank=True)
    # Only meaningful when trained_in_thailand is True.
    thailand_trips = models.CharField(max_length=32, choices=c.ThailandTrips.choices, blank=True)
    other_combat_sports = models.JSONField(default=list, blank=True)
    competition_experience = models.CharField(max_length=32, choices=c.CompetitionExperience.choices, blank=True)
    # Only meaningful when competition_experience is not NEVER.
    fight_count = models.CharField(max_length=32, choices=c.FightCount.choices, blank=True)
    sparring_experience = models.CharField(max_length=32, choices=c.SparringExperience.choices, blank=True)

    # --- Current fitness --------------------------------------------------
    exercise_frequency = models.CharField(max_length=32, choices=c.ExerciseFrequency.choices, blank=True)
    cardio_level = models.CharField(max_length=32, choices=c.CardioLevel.choices, blank=True)
    five_round_capability = models.CharField(max_length=32, choices=c.FiveRoundCapability.choices, blank=True)
    overall_fitness = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(c.SCALE_MIN), MaxValueValidator(c.SCALE_MAX)],
        help_text='1–10, where 1 is very low fitness and 10 is excellent fitness.',
    )

    # --- Goals & style ----------------------------------------------------
    goals = models.JSONField(default=list, blank=True, help_text=f'Up to {c.MAX_GOALS} goals.')
    primary_focus = models.CharField(max_length=32, choices=c.PrimaryFocus.choices, blank=True)
    primary_focus_notes = models.TextField(blank=True)
    fighting_styles = models.JSONField(default=list, blank=True, help_text=f'Up to {c.MAX_FIGHTING_STYLES} styles.')
    favourite_techniques = models.JSONField(
        default=list, blank=True, help_text=f'Up to {c.MAX_FAVOURITE_TECHNIQUES} techniques.',
    )

    # --- Injuries & trainer information (private) -------------------------
    injury_status = models.CharField(max_length=32, choices=c.InjuryStatus.choices, blank=True)
    injury_areas = models.JSONField(default=list, blank=True)
    injury_notes = models.TextField(blank=True)
    has_past_major_injury = models.BooleanField(null=True, blank=True)
    past_injury_types = models.JSONField(default=list, blank=True)
    training_restrictions = models.JSONField(default=list, blank=True)
    training_restrictions_notes = models.TextField(blank=True)
    has_medical_condition = models.BooleanField(null=True, blank=True)
    medical_details = models.TextField(blank=True)
    coach_intensity = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(c.SCALE_MIN), MaxValueValidator(c.SCALE_MAX)],
        help_text='1–10, where 1 is keep it light and 10 is push me to my limit.',
    )
    # Independent of the intensity slider: someone can want to be pushed hard
    # and still need a knee worked around.
    train_around_limitations = models.BooleanField(default=False)
    message_to_kru = models.TextField(blank=True)

    # Denormalised so admins can filter on it; recomputed on every save.
    is_complete = models.BooleanField(default=False)
    # Set the first time the card becomes complete, and kept from then on —
    # it records when the trainers could first rely on it.
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fighters_fightercard'
        ordering = ['-updated_at']
        verbose_name = 'fighter card'
        verbose_name_plural = 'fighter cards'

    def __str__(self):
        return f"Fighter card for {self.user.email}"

    @property
    def missing_fields(self):
        """Unanswered required questions, in form order — drives the progress UI."""
        return [name for name in self.REQUIRED_FOR_COMPLETION if self._is_unanswered(name)]

    def _is_unanswered(self, name):
        value = getattr(self, name)
        # An empty file field is a FieldFile carrying no name — it matches
        # none of the emptiness checks below, so without this a missing photo
        # would silently count as answered.
        if isinstance(value, FieldFile):
            return not value
        # False is a real answer to a yes/no question; only None and empty
        # strings/lists count as unanswered.
        return value is None or value == '' or value == []

    def save(self, *args, **kwargs):
        self.is_complete = not self.missing_fields
        if self.is_complete and self.completed_at is None:
            self.completed_at = timezone.now()
        # A targeted save (e.g. update_fields=['camp']) must still persist the
        # completion flags this method just recomputed.
        update_fields = kwargs.get('update_fields')
        if update_fields is not None:
            kwargs['update_fields'] = set(update_fields) | {'is_complete', 'completed_at'}
        super().save(*args, **kwargs)

    @staticmethod
    def camp_from_bookings(user):
        """The camp a user's bookings point at, or None.

        Answers "Which Thailand camp are you joining?" without asking it again.
        A paid order wins over a pending one, and the most recent order wins
        within each; a group package spanning several camps has no single
        answer, so the first of its locations is used as the best guess and the
        fighter can still override it.
        """
        from orders.models import Order, OrderStatus

        orders = list(
            Order.objects
            .filter(user=user, status__in=[OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.PENDING])
            .select_related('package')
            .prefetch_related('package__locations')
            .order_by('-created_at')
        )
        # Stable sort, so the newest order still wins inside each group.
        orders.sort(key=lambda o: 0 if o.status in (OrderStatus.PAID, OrderStatus.COMPLETED) else 1)
        for order in orders:
            location = order.package.locations.first()
            if location:
                return location
        return None


@receiver(post_delete, sender=FighterCard)
def delete_fighter_card_photo(sender, instance, **kwargs):
    """Remove the backing file from storage (S3) when the card is deleted.

    Neither QuerySet.delete() (the admin's bulk delete) nor the cascade from
    deleting a user calls FieldFile.delete(), so without this the photo would
    outlive the card it belongs to. Mirrors `delete_location_image_file`.
    """
    if instance.photo:
        instance.photo.delete(save=False)
