"""Choice sets for the fighter card.

Every question on the card is stored as a code, never as free text, so the
answers stay aggregatable for the trainers. Labels here are the exact wording
shown on the form; the frontend reads them from `/api/fighter-cards/options/`
rather than hard-coding its own copy, which keeps the two in step.
"""
from django.db import models


# --- Training background ------------------------------------------------

class TrainingDuration(models.TextChoices):
    NEVER = 'NEVER', 'Never / Brand new'
    UNDER_3_MONTHS = 'UNDER_3_MONTHS', 'Less than 3 months'
    THREE_TO_SIX_MONTHS = 'THREE_TO_SIX_MONTHS', '3–6 months'
    SIX_TO_TWELVE_MONTHS = 'SIX_TO_TWELVE_MONTHS', '6–12 months'
    ONE_TO_TWO_YEARS = 'ONE_TO_TWO_YEARS', '1–2 years'
    TWO_TO_FIVE_YEARS = 'TWO_TO_FIVE_YEARS', '2–5 years'
    FIVE_PLUS_YEARS = 'FIVE_PLUS_YEARS', '5+ years'


class TrainingFrequency(models.TextChoices):
    NOT_TRAINING = 'NOT_TRAINING', 'Not currently training'
    ONE_DAY = 'ONE_DAY', '1 day'
    TWO_DAYS = 'TWO_DAYS', '2 days'
    THREE_DAYS = 'THREE_DAYS', '3 days'
    FOUR_DAYS = 'FOUR_DAYS', '4 days'
    FIVE_DAYS = 'FIVE_DAYS', '5 days'
    SIX_PLUS_DAYS = 'SIX_PLUS_DAYS', '6+ days'


class ThailandTrips(models.TextChoices):
    ONCE = 'ONCE', 'Once'
    TWO_TO_THREE = 'TWO_TO_THREE', '2–3 times'
    FOUR_PLUS = 'FOUR_PLUS', '4+ times'


class CombatSport(models.TextChoices):
    BOXING = 'BOXING', 'Boxing'
    KICKBOXING = 'KICKBOXING', 'Kickboxing'
    MMA = 'MMA', 'MMA'
    BJJ = 'BJJ', 'Brazilian Jiu-Jitsu'
    WRESTLING = 'WRESTLING', 'Wrestling'
    KARATE = 'KARATE', 'Karate'
    TAEKWONDO = 'TAEKWONDO', 'Taekwondo'
    JUDO = 'JUDO', 'Judo'
    SANDA = 'SANDA', 'Sanda'
    KRAV_MAGA = 'KRAV_MAGA', 'Krav Maga'
    OTHER = 'OTHER', 'Other'
    NONE = 'NONE', 'None'


class CompetitionExperience(models.TextChoices):
    NEVER = 'NEVER', 'Never'
    MUAY_THAI = 'MUAY_THAI', 'Yes — Muay Thai'
    BOXING = 'BOXING', 'Yes — Boxing'
    KICKBOXING = 'KICKBOXING', 'Yes — Kickboxing'
    MMA = 'MMA', 'Yes — MMA'
    OTHER = 'OTHER', 'Yes — Other combat sport'


class FightCount(models.TextChoices):
    ONE = 'ONE', '1'
    TWO_TO_FIVE = 'TWO_TO_FIVE', '2–5'
    SIX_TO_TEN = 'SIX_TO_TEN', '6–10'
    TEN_PLUS = 'TEN_PLUS', '10+'


class SparringExperience(models.TextChoices):
    NEVER = 'NEVER', 'Never'
    A_FEW_TIMES = 'A_FEW_TIMES', 'A few times'
    OCCASIONALLY = 'OCCASIONALLY', 'Occasionally'
    REGULARLY = 'REGULARLY', 'Regularly'
    FREQUENTLY = 'FREQUENTLY', 'Frequently'


# --- Current fitness ----------------------------------------------------

class ExerciseFrequency(models.TextChoices):
    NONE = 'NONE', "I don't currently exercise"
    ONE_DAY = 'ONE_DAY', '1 day'
    TWO_DAYS = 'TWO_DAYS', '2 days'
    THREE_DAYS = 'THREE_DAYS', '3 days'
    FOUR_DAYS = 'FOUR_DAYS', '4 days'
    FIVE_DAYS = 'FIVE_DAYS', '5 days'
    SIX_DAYS = 'SIX_DAYS', '6 days'
    EVERY_DAY = 'EVERY_DAY', 'Every day'


class CardioLevel(models.TextChoices):
    BEGINNER = 'BEGINNER', 'Beginner — I get tired quickly'
    BELOW_AVERAGE = 'BELOW_AVERAGE', 'Below average — I can exercise, but cardio is challenging'
    AVERAGE = 'AVERAGE', 'Average — I can handle moderate training'
    GOOD = 'GOOD', 'Good — I can train for long periods without struggling'
    EXCELLENT = 'EXCELLENT', 'Excellent — I have strong endurance and recover quickly'


class FiveRoundCapability(models.TextChoices):
    """Could you comfortably complete 5 × 3-minute training rounds?"""
    YES_COMFORTABLY = 'YES_COMFORTABLY', 'Yes, comfortably'
    YES_BUT_TIRED = 'YES_BUT_TIRED', 'Yes, but I would be tired'
    MAYBE = 'MAYBE', 'Maybe / Not sure'
    PROBABLY_NOT = 'PROBABLY_NOT', 'Probably not'
    NO = 'NO', 'No'


# --- Goals & style ------------------------------------------------------

class Goal(models.TextChoices):
    IMPROVE_TECHNIQUE = 'IMPROVE_TECHNIQUE', 'Improve technique'
    IMPROVE_STRIKING = 'IMPROVE_STRIKING', 'Improve striking'
    IMPROVE_DEFENCE = 'IMPROVE_DEFENCE', 'Improve defence'
    IMPROVE_FOOTWORK = 'IMPROVE_FOOTWORK', 'Improve footwork'
    IMPROVE_CLINCH = 'IMPROVE_CLINCH', 'Improve clinch'
    IMPROVE_CARDIO = 'IMPROVE_CARDIO', 'Improve cardio & fitness'
    BUILD_ENDURANCE = 'BUILD_ENDURANCE', 'Build endurance'
    BUILD_STRENGTH = 'BUILD_STRENGTH', 'Build strength'
    LOSE_WEIGHT = 'LOSE_WEIGHT', 'Lose weight'
    BUILD_CONFIDENCE = 'BUILD_CONFIDENCE', 'Build confidence'
    PREPARE_FOR_FIGHT = 'PREPARE_FOR_FIGHT', 'Prepare for a fight'
    IMPROVE_SPARRING = 'IMPROVE_SPARRING', 'Improve sparring'
    AUTHENTIC_EXPERIENCE = 'AUTHENTIC_EXPERIENCE', 'Experience authentic Muay Thai'
    THAI_TRAINING_CULTURE = 'THAI_TRAINING_CULTURE', 'Learn Thai training culture'
    HIGHER_INTENSITY = 'HIGHER_INTENSITY', 'Train at a higher intensity'
    OTHER = 'OTHER', 'Other'


class PrimaryFocus(models.TextChoices):
    """The one thing the fighter most wants to improve."""
    TECHNIQUE = 'TECHNIQUE', 'Technique'
    STRIKING = 'STRIKING', 'Striking'
    DEFENCE = 'DEFENCE', 'Defence'
    FOOTWORK = 'FOOTWORK', 'Footwork'
    CLINCH = 'CLINCH', 'Clinch'
    CARDIO = 'CARDIO', 'Cardio'
    ENDURANCE = 'ENDURANCE', 'Endurance'
    STRENGTH = 'STRENGTH', 'Strength'
    SPARRING = 'SPARRING', 'Sparring'
    CONFIDENCE = 'CONFIDENCE', 'Confidence'
    FIGHT_READINESS = 'FIGHT_READINESS', 'Fight readiness'
    OTHER = 'OTHER', 'Other'


class FightingStyle(models.TextChoices):
    BEGINNER = 'BEGINNER', 'Beginner / Still discovering'
    TECHNICAL = 'TECHNICAL', 'Technical'
    PRESSURE_FIGHTER = 'PRESSURE_FIGHTER', 'Pressure fighter'
    COUNTER_FIGHTER = 'COUNTER_FIGHTER', 'Counter fighter'
    DEFENSIVE = 'DEFENSIVE', 'Defensive'
    AGGRESSIVE = 'AGGRESSIVE', 'Aggressive'
    POWER_FOCUSED = 'POWER_FOCUSED', 'Power-focused'
    SPEED_FOCUSED = 'SPEED_FOCUSED', 'Speed-focused'
    CLINCH_FOCUSED = 'CLINCH_FOCUSED', 'Clinch-focused'
    MOVEMENT_FOCUSED = 'MOVEMENT_FOCUSED', 'Movement-focused'
    NOT_SURE_YET = 'NOT_SURE_YET', 'Not sure yet'


class FavouriteTechnique(models.TextChoices):
    JAB = 'JAB', 'Jab'
    CROSS = 'CROSS', 'Cross'
    HOOK = 'HOOK', 'Hook'
    UPPERCUT = 'UPPERCUT', 'Uppercut'
    ELBOWS = 'ELBOWS', 'Elbows'
    KNEES = 'KNEES', 'Knees'
    TEEP = 'TEEP', 'Teep'
    ROUNDHOUSE = 'ROUNDHOUSE', 'Roundhouse / Kick'
    LOW_KICKS = 'LOW_KICKS', 'Low kicks'
    BODY_KICKS = 'BODY_KICKS', 'Body kicks'
    CLINCH = 'CLINCH', 'Clinch'
    SWEEP = 'SWEEP', 'Sweep / Dump'
    DEFENCE_COUNTERS = 'DEFENCE_COUNTERS', 'Defence / Counters'
    NOT_SURE_YET = 'NOT_SURE_YET', 'Not sure yet'
    OTHER = 'OTHER', 'Other'


# --- Injuries & trainer information (private) ---------------------------

class InjuryStatus(models.TextChoices):
    NO = 'NO', 'No'
    YES_MINOR = 'YES_MINOR', 'Yes — Minor'
    YES_MODERATE = 'YES_MODERATE', 'Yes — Moderate'
    YES_SIGNIFICANT = 'YES_SIGNIFICANT', 'Yes — Significant'
    PREFER_TO_DISCUSS = 'PREFER_TO_DISCUSS', 'Prefer to discuss with trainer'


#: Injury statuses that unlock the "where is the injury" follow-up.
INJURY_PRESENT_STATUSES = frozenset({
    InjuryStatus.YES_MINOR,
    InjuryStatus.YES_MODERATE,
    InjuryStatus.YES_SIGNIFICANT,
})


class InjuryArea(models.TextChoices):
    HEAD_NECK = 'HEAD_NECK', 'Head / Neck'
    SHOULDER = 'SHOULDER', 'Shoulder'
    ELBOW = 'ELBOW', 'Elbow'
    WRIST_HAND = 'WRIST_HAND', 'Wrist / Hand'
    BACK = 'BACK', 'Back'
    HIP = 'HIP', 'Hip'
    KNEE = 'KNEE', 'Knee'
    ANKLE = 'ANKLE', 'Ankle'
    FOOT = 'FOOT', 'Foot'
    OTHER = 'OTHER', 'Other'


class PastInjuryType(models.TextChoices):
    BONE_FRACTURE = 'BONE_FRACTURE', 'Bone / Fracture'
    JOINT = 'JOINT', 'Joint'
    MUSCLE_TENDON = 'MUSCLE_TENDON', 'Muscle / Tendon'
    LIGAMENT = 'LIGAMENT', 'Ligament'
    HEAD_CONCUSSION = 'HEAD_CONCUSSION', 'Head / Concussion'
    BACK_SPINE = 'BACK_SPINE', 'Back / Spine'
    SURGERY = 'SURGERY', 'Surgery'
    OTHER = 'OTHER', 'Other'


class TrainingRestriction(models.TextChoices):
    RUNNING = 'RUNNING', 'Running'
    JUMPING = 'JUMPING', 'Jumping'
    HEAVY_KICKING = 'HEAVY_KICKING', 'Heavy kicking'
    HEAVY_PUNCHING = 'HEAVY_PUNCHING', 'Heavy punching'
    ELBOWS = 'ELBOWS', 'Elbows'
    KNEES = 'KNEES', 'Knees'
    CLINCH = 'CLINCH', 'Clinch'
    SPARRING = 'SPARRING', 'Sparring'
    HARD_SPARRING = 'HARD_SPARRING', 'Hard sparring'
    CERTAIN_MOVEMENTS = 'CERTAIN_MOVEMENTS', 'Certain movements'
    HIGH_INTENSITY = 'HIGH_INTENSITY', 'High-intensity conditioning'
    NO_RESTRICTIONS = 'NO_RESTRICTIONS', 'No restrictions'
    OTHER = 'OTHER', 'Other'


# --- Multi-select rules -------------------------------------------------

#: "Top 3 goals" is a real cap, not a hint — the trainers use it to prioritise.
MAX_GOALS = 3
MAX_FIGHTING_STYLES = 2
MAX_FAVOURITE_TECHNIQUES = 2
MAX_INJURY_AREAS = len(InjuryArea.choices)

#: Answers that mean "nothing applies" and therefore cannot be combined with
#: any other answer in the same list.
EXCLUSIVE_CHOICES = {
    'other_combat_sports': CombatSport.NONE,
    'fighting_styles': FightingStyle.NOT_SURE_YET,
    'favourite_techniques': FavouriteTechnique.NOT_SURE_YET,
    'training_restrictions': TrainingRestriction.NO_RESTRICTIONS,
}

#: Labels for the two 1–10 sliders, echoed in the options endpoint so the
#: frontend renders the same anchors the questions were written with.
FITNESS_SCALE_LABELS = {1: 'Very low fitness', 5: 'Average', 10: 'Excellent fitness'}
INTENSITY_SCALE_LABELS = {1: 'Keep it light', 5: 'Challenging but manageable', 10: 'Push me to my limit'}

SCALE_MIN = 1
SCALE_MAX = 10


# --- Photo ---------------------------------------------------------------

#: An optional head-and-shoulders photo, so a trainer can put a face to the
#: card before the fighter walks in. Capped because it is normally taken on a
#: phone, where an untouched original runs well past 10 MB.
MAX_PHOTO_BYTES = 5 * 1024 * 1024

#: Pillow format names accepted on upload. HEIC — what an iPhone shoots by
#: default — is deliberately absent: Pillow cannot decode it without an extra
#: system library, so it is refused with a readable message rather than a 500.
#: iOS converts to JPEG on upload from a browser file picker, so this is not
#: the wall it looks like.
ALLOWED_PHOTO_FORMATS = ('JPEG', 'PNG', 'WEBP')

#: The same list in the two shapes the frontend needs: `accept` on the file
#: input, and the extensions to name in the error copy.
ALLOWED_PHOTO_CONTENT_TYPES = ('image/jpeg', 'image/png', 'image/webp')
ALLOWED_PHOTO_EXTENSIONS = ('jpg', 'jpeg', 'png', 'webp')
