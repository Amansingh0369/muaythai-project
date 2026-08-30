from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from locations.models import Location
from users.models import Profile

from . import constants as c
from .models import FighterCard


class ChoiceListField(serializers.ListField):
    """A multi-select answer: a list of codes from one choice set.

    Enforces the three rules the form has that a plain ListField does not —
    a cap on how many may be picked ("top 3 goals" is a cap, not a hint),
    no duplicates, and no combining an exclusive "None" answer with a real one.
    """

    def __init__(self, choices, max_items=None, exclusive=None, **kwargs):
        self.choices = dict(choices)
        self.max_items = max_items
        self.exclusive = exclusive
        kwargs.setdefault('required', False)
        kwargs.setdefault('allow_empty', True)
        super().__init__(child=serializers.ChoiceField(choices=choices), **kwargs)

    def to_internal_value(self, data):
        values = super().to_internal_value(data)

        deduped = list(dict.fromkeys(values))
        if len(deduped) != len(values):
            raise serializers.ValidationError('Each option may only be selected once.')

        if self.max_items is not None and len(deduped) > self.max_items:
            raise serializers.ValidationError(
                f'Select at most {self.max_items} option{"s" if self.max_items > 1 else ""}.'
            )

        if self.exclusive is not None and self.exclusive in deduped and len(deduped) > 1:
            raise serializers.ValidationError(
                f'"{self.choices[self.exclusive]}" cannot be combined with other options.'
            )

        return deduped


class CampSerializer(serializers.ModelSerializer):
    """The camp as it is shown on the card — never edited through it."""

    class Meta:
        model = Location
        fields = ('id', 'name', 'city')


class FighterCardSerializer(serializers.ModelSerializer):
    """The whole card, including the private section.

    Only ever served to the fighter it belongs to or to staff; see the
    permissions on the views.
    """

    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    camp = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), required=False, allow_null=True,
    )
    camp_detail = CampSerializer(source='camp', read_only=True)
    missing_fields = serializers.ListField(child=serializers.CharField(), read_only=True)

    other_combat_sports = ChoiceListField(
        choices=c.CombatSport.choices, exclusive=c.EXCLUSIVE_CHOICES['other_combat_sports'],
    )
    goals = ChoiceListField(choices=c.Goal.choices, max_items=c.MAX_GOALS)
    fighting_styles = ChoiceListField(
        choices=c.FightingStyle.choices, max_items=c.MAX_FIGHTING_STYLES,
        exclusive=c.EXCLUSIVE_CHOICES['fighting_styles'],
    )
    favourite_techniques = ChoiceListField(
        choices=c.FavouriteTechnique.choices, max_items=c.MAX_FAVOURITE_TECHNIQUES,
        exclusive=c.EXCLUSIVE_CHOICES['favourite_techniques'],
    )
    injury_areas = ChoiceListField(choices=c.InjuryArea.choices)
    past_injury_types = ChoiceListField(choices=c.PastInjuryType.choices)
    training_restrictions = ChoiceListField(
        choices=c.TrainingRestriction.choices,
        exclusive=c.EXCLUSIVE_CHOICES['training_restrictions'],
    )

    class Meta:
        model = FighterCard
        fields = (
            'id', 'user', 'user_email', 'user_full_name', 'camp', 'camp_detail',
            # Basic profile
            'photo', 'nationality', 'city',
            # Training background
            'training_duration', 'training_frequency', 'trained_in_thailand',
            'thailand_trips', 'other_combat_sports', 'competition_experience',
            'fight_count', 'sparring_experience',
            # Current fitness
            'exercise_frequency', 'cardio_level', 'five_round_capability', 'overall_fitness',
            # Goals & style
            'goals', 'primary_focus', 'primary_focus_notes', 'fighting_styles',
            'favourite_techniques',
            # Injuries & trainer information (private)
            'injury_status', 'injury_areas', 'injury_notes', 'has_past_major_injury',
            'past_injury_types', 'training_restrictions', 'training_restrictions_notes',
            'has_medical_condition', 'medical_details', 'coach_intensity',
            'train_around_limitations', 'message_to_kru',
            # Status
            'is_complete', 'missing_fields', 'completed_at', 'created_at', 'updated_at',
        )
        # `photo` is read-only here on purpose: it is written through
        # `/me/photo/`, so the section saves on this endpoint stay JSON.
        read_only_fields = (
            'id', 'user', 'photo', 'is_complete', 'completed_at', 'created_at', 'updated_at',
        )

    def validate_overall_fitness(self, value):
        return self._validate_scale(value, 'overall fitness')

    def validate_coach_intensity(self, value):
        return self._validate_scale(value, 'coaching intensity')

    @staticmethod
    def _validate_scale(value, label):
        if value is not None and not (c.SCALE_MIN <= value <= c.SCALE_MAX):
            raise serializers.ValidationError(
                f'Rate your {label} between {c.SCALE_MIN} and {c.SCALE_MAX}.'
            )
        return value

    def validate(self, attrs):
        """Enforce the form's conditional questions.

        Each follow-up ("If Yes → …") is only answerable while its trigger says
        yes. Answering one that is not open is an error, but a follow-up left
        over from a previous answer is cleared rather than rejected — switching
        "any injuries?" from yes to no must not fail on data the fighter can no
        longer see.
        """
        errors = {}

        self._follow_up(
            attrs, errors,
            open_when=self._answer(attrs, 'trained_in_thailand') is True,
            field='thailand_trips', empty='', required=True,
            missing_message='Tell us how many times you have trained in Thailand.',
            closed_message='Only answer this if you have trained in Thailand before.',
        )

        competed = self._answer(attrs, 'competition_experience')
        self._follow_up(
            attrs, errors,
            open_when=bool(competed) and competed != c.CompetitionExperience.NEVER,
            field='fight_count', empty='', required=False,
            closed_message='Only answer this if you have competed.',
        )

        injury_present = self._answer(attrs, 'injury_status') in c.INJURY_PRESENT_STATUSES
        self._follow_up(
            attrs, errors,
            open_when=injury_present, field='injury_areas', empty=[], required=True,
            missing_message='Tell us where the injury or pain is.',
            closed_message='Only answer this if you currently have an injury or pain.',
        )
        self._follow_up(
            attrs, errors,
            open_when=injury_present, field='injury_notes', empty='', required=False,
            closed_message='Only answer this if you currently have an injury or pain.',
        )

        self._follow_up(
            attrs, errors,
            open_when=self._answer(attrs, 'has_past_major_injury') is True,
            field='past_injury_types', empty=[], required=True,
            missing_message='Tell us what type of injury or surgery it was.',
            closed_message='Only answer this if you have had a major injury or surgery.',
        )

        self._follow_up(
            attrs, errors,
            open_when=self._answer(attrs, 'has_medical_condition') is True,
            field='medical_details', empty='', required=True,
            missing_message='Tell the trainer about the condition or medication.',
            closed_message='Only answer this if you have a medical condition or take medication.',
        )

        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def _answer(self, attrs, field):
        """The value a field will hold after this write — the incoming one if
        the client sent it, otherwise what the card already holds."""
        if field in attrs:
            return attrs[field]
        if self.instance is not None:
            return getattr(self.instance, field)
        return None

    def _follow_up(self, attrs, errors, *, open_when, field, empty, required,
                   missing_message=None, closed_message=None):
        answered = self._answer(attrs, field)
        if open_when:
            if required and (answered is None or answered == empty):
                errors[field] = missing_message
        elif answered not in (None, empty):
            if field in attrs:
                errors[field] = closed_message
            else:
                # Left over from a previous answer the fighter has since
                # changed; drop it instead of blocking the write.
                attrs[field] = empty


class FighterCardPhotoSerializer(serializers.ModelSerializer):
    """The card photo, written on its own.

    Kept off `FighterCardSerializer` so the section-by-section saves stay JSON:
    a file field there would force every partial save onto multipart, whether
    or not it touched the photo.
    """

    photo = serializers.ImageField(required=True)

    class Meta:
        model = FighterCard
        fields = ('photo',)

    def validate_photo(self, value):
        if value.size > c.MAX_PHOTO_BYTES:
            megabytes = c.MAX_PHOTO_BYTES // (1024 * 1024)
            raise serializers.ValidationError(f'Keep the photo under {megabytes} MB.')

        # ImageField has already opened the upload with Pillow to prove it is
        # an image at all; this only narrows which formats we are willing to
        # store. `format` is absent if Pillow could not name it — treat that as
        # unrecognised rather than trusting it.
        image_format = getattr(getattr(value, 'image', None), 'format', None)
        if image_format is None or image_format.upper() not in c.ALLOWED_PHOTO_FORMATS:
            accepted = ', '.join(fmt.upper() for fmt in c.ALLOWED_PHOTO_FORMATS)
            raise serializers.ValidationError(f'Upload a {accepted} image.')

        return value

    def update(self, instance, validated_data):
        # Hold on to the outgoing file: replacing a photo must not leave the
        # old S3 object behind, and reassigning the field forgets it.
        previous = instance.photo if instance.photo else None
        instance = super().update(instance, validated_data)
        if previous is not None and previous.name != instance.photo.name:
            previous.delete(save=False)
        return instance


class FighterCardSummarySerializer(serializers.ModelSerializer):
    """Compact card for admin list views.

    Carries the flags a trainer scans a roster for — is the card usable yet,
    does this fighter need working around — without the private free text,
    which belongs on the detail view they open deliberately.
    """

    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    camp_detail = CampSerializer(source='camp', read_only=True)
    has_injury = serializers.SerializerMethodField()

    class Meta:
        model = FighterCard
        fields = (
            'id', 'user', 'user_email', 'user_full_name', 'camp', 'camp_detail',
            'photo', 'nationality', 'city', 'training_duration', 'competition_experience',
            'cardio_level', 'overall_fitness', 'coach_intensity',
            'has_injury', 'train_around_limitations', 'is_complete', 'updated_at',
        )
        read_only_fields = fields

    def get_has_injury(self, obj) -> bool:
        return obj.injury_status in c.INJURY_PRESENT_STATUSES


class ProfileMedicalSerializer(serializers.ModelSerializer):
    """The medical notes the customer gave on their account profile."""

    class Meta:
        model = Profile
        fields = ('medical_conditions', 'allergies')
        read_only_fields = fields


class FighterCardAdminSerializer(FighterCardSerializer):
    """The card as staff read it, with the account's medical notes attached.

    Medical information can arrive by two routes — the card's private section
    and the older `Profile.medical_conditions`/`allergies` fields, which the
    customer filled in at signup. A trainer reading one and missing the other
    is exactly the failure this guards against, so the card carries both.
    Read-only here: the profile is edited through `/api/users/`.
    """

    profile_medical = serializers.SerializerMethodField()

    class Meta(FighterCardSerializer.Meta):
        fields = FighterCardSerializer.Meta.fields + ('profile_medical',)

    @extend_schema_field(ProfileMedicalSerializer)
    def get_profile_medical(self, obj):
        # A user should always have a profile (created by a signal), but a card
        # is not worth a 500 if one is ever missing.
        profile = getattr(obj.user, 'profile', None)
        if profile is None:
            return None
        return ProfileMedicalSerializer(profile).data
