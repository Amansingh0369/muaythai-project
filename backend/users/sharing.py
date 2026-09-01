"""Assembling and emailing a customer's profile dossier.

A "dossier" is what someone outside the platform needs to know about a fighter
before they arrive — who they are, and what their fighter card says. An admin
emails it to a camp, a coach or a partner agent, who needs no account: it is a
one-way briefing.

Bookings and payments are deliberately not part of it. A coach preparing
sessions needs the fighter, not the transaction, and a field that cannot be sent
cannot leak.

It is deliberately assembled here rather than by reusing the API serializers:
the recipient is reading an email, not consuming JSON, so every code becomes its
human label, every blank becomes "Not answered", and the sections are ordered
the way someone briefing a trainer would say them out loud.

**This carries confidential information** — passport numbers, medical
conditions, allergies, and the fighter card's private trainer-only section — to
an address a human typed in. `sections` exists so a share can carry only what
the recipient actually needs, and every send is recorded in `ProfileShare`.
"""
from django.conf import settings
from django.utils.formats import date_format

from core.emails import send_html_email
from fighters import constants as c
from fighters.countries import COUNTRIES
from fighters.models import FighterCard

#: The sections a share can carry, in the order they appear in the email.
#: A share names a subset of these; the default is all of them.
SECTION_KEYS = ('customer', 'fighter_card')

SECTION_TITLES = {
    'customer': 'Customer',
    'fighter_card': 'Fighter card',
}

NOT_ANSWERED = 'Not answered'

#: Label lookups for the fighter card's JSON list fields. Those store bare
#: codes and have no get_FOO_display(), so the labels have to be resolved here.
_LIST_FIELD_CHOICES = {
    'other_combat_sports': c.CombatSport.choices,
    'goals': c.Goal.choices,
    'fighting_styles': c.FightingStyle.choices,
    'favourite_techniques': c.FavouriteTechnique.choices,
    'injury_areas': c.InjuryArea.choices,
    'past_injury_types': c.PastInjuryType.choices,
    'training_restrictions': c.TrainingRestriction.choices,
}


def _text(value):
    """A plain value as the reader should see it, blanks made explicit."""
    if value is None or value == '':
        return NOT_ANSWERED
    return str(value)


def _date(value):
    return date_format(value, 'j F Y') if value else NOT_ANSWERED


def _yes_no(value):
    if value is None:
        return NOT_ANSWERED
    return 'Yes' if value else 'No'


def _choice(instance, field):
    """The human label behind a single-choice field."""
    if not getattr(instance, field, ''):
        return NOT_ANSWERED
    return getattr(instance, f'get_{field}_display')()


def _choice_list(instance, field):
    """The human labels behind a JSON list of choice codes, comma-separated."""
    values = getattr(instance, field, None) or []
    if not values:
        return NOT_ANSWERED
    labels = dict(_LIST_FIELD_CHOICES[field])
    # Fall back to the raw code for anything unrecognised: a value retired from
    # the choice set must still be readable rather than vanishing from the card.
    return ', '.join(str(labels.get(value, value)) for value in values)


def _scale(value, out_of=10):
    return f'{value} / {out_of}' if value is not None else NOT_ANSWERED


def _block(subtitle, rows):
    return {'subtitle': subtitle, 'rows': rows}


def _section(key, blocks, note=''):
    return {'key': key, 'title': SECTION_TITLES[key], 'blocks': blocks, 'note': note}


def _customer_section(user):
    account_rows = [
        {'label': 'Name', 'value': _text(user.full_name)},
        {'label': 'Email', 'value': user.email},
        {'label': 'Customer since', 'value': _date(user.created_at.date())},
    ]

    profile = getattr(user, 'profile', None)
    if profile is None:
        # A signal creates a profile with every user, so this is defensive only.
        return _section('customer', [_block('Account', account_rows)])

    return _section('customer', [
        _block('Account', account_rows),
        _block('Personal details', [
            {'label': 'Age', 'value': _text(profile.age)},
            {'label': 'Gender', 'value': _choice(profile, 'gender')},
            {'label': 'Phone', 'value': _text(profile.phone)},
            {'label': 'Passport', 'value': _text(profile.passport)},
            {'label': 'Experience', 'value': _choice(profile, 'experience')},
            {'label': 'Height', 'value': f'{profile.height} cm' if profile.height else NOT_ANSWERED},
            {'label': 'Weight', 'value': f'{profile.weight} kg' if profile.weight else NOT_ANSWERED},
        ]),
        _block('Emergency contact', [
            {'label': 'Name', 'value': _text(profile.emergency_contact_name)},
            {'label': 'Phone', 'value': _text(profile.emergency_contact_phone)},
        ]),
        _block('Medical notes on file', [
            {'label': 'Medical conditions', 'value': _text(profile.medical_conditions)},
            {'label': 'Allergies', 'value': _text(profile.allergies)},
        ]),
    ])


def _fighter_card_section(user):
    card = FighterCard.objects.filter(user=user).select_related('camp').first()
    if card is None:
        return _section(
            'fighter_card', [],
            note='This customer has not started a fighter card yet.',
        )

    nationality = dict(COUNTRIES).get(card.nationality) if card.nationality else None
    missing = len(card.missing_fields)
    status = 'Complete' if card.is_complete else f'Incomplete — {missing} answer(s) outstanding'

    return _section('fighter_card', [
        _block('Status', [
            {'label': 'Card status', 'value': status},
            {'label': 'Camp', 'value': card.camp.name if card.camp else NOT_ANSWERED},
            {'label': 'Last updated', 'value': _date(card.updated_at.date())},
        ]),
        _block('Basic profile', [
            {'label': 'Nationality', 'value': _text(nationality)},
            {'label': 'City', 'value': _text(card.city)},
        ]),
        _block('Training background', [
            {'label': 'Training for', 'value': _choice(card, 'training_duration')},
            {'label': 'Trains', 'value': _choice(card, 'training_frequency')},
            {'label': 'Trained in Thailand', 'value': _yes_no(card.trained_in_thailand)},
            {'label': 'Trips to Thailand', 'value': _choice(card, 'thailand_trips')},
            {'label': 'Other combat sports', 'value': _choice_list(card, 'other_combat_sports')},
            {'label': 'Competition experience', 'value': _choice(card, 'competition_experience')},
            {'label': 'Fights', 'value': _choice(card, 'fight_count')},
            {'label': 'Sparring', 'value': _choice(card, 'sparring_experience')},
        ]),
        _block('Current fitness', [
            {'label': 'Exercises', 'value': _choice(card, 'exercise_frequency')},
            {'label': 'Cardio', 'value': _choice(card, 'cardio_level')},
            {'label': 'Five rounds', 'value': _choice(card, 'five_round_capability')},
            {'label': 'Overall fitness', 'value': _scale(card.overall_fitness)},
        ]),
        _block('Goals & style', [
            {'label': 'Goals', 'value': _choice_list(card, 'goals')},
            {'label': 'Primary focus', 'value': _choice(card, 'primary_focus')},
            {'label': 'Focus notes', 'value': _text(card.primary_focus_notes)},
            {'label': 'Fighting styles', 'value': _choice_list(card, 'fighting_styles')},
            {'label': 'Favourite techniques', 'value': _choice_list(card, 'favourite_techniques')},
        ]),
        # The card's "Private / Trainer Only" section. It is the reason a share
        # is admin-only and audited — see the module docstring.
        _block('Injuries & trainer notes (private)', [
            {'label': 'Current injuries', 'value': _choice(card, 'injury_status')},
            {'label': 'Injured areas', 'value': _choice_list(card, 'injury_areas')},
            {'label': 'Injury notes', 'value': _text(card.injury_notes)},
            {'label': 'Past major injury', 'value': _yes_no(card.has_past_major_injury)},
            {'label': 'Past injury types', 'value': _choice_list(card, 'past_injury_types')},
            {'label': 'Training restrictions', 'value': _choice_list(card, 'training_restrictions')},
            {'label': 'Restriction notes', 'value': _text(card.training_restrictions_notes)},
            {'label': 'Medical condition', 'value': _yes_no(card.has_medical_condition)},
            {'label': 'Medical details', 'value': _text(card.medical_details)},
            {'label': 'Wanted coaching intensity', 'value': _scale(card.coach_intensity)},
            {'label': 'Train around limitations', 'value': _yes_no(card.train_around_limitations)},
            {'label': 'Message to the Kru', 'value': _text(card.message_to_kru)},
        ]),
    ])


_SECTION_BUILDERS = {
    'customer': _customer_section,
    'fighter_card': _fighter_card_section,
}


def build_dossier(user, sections=None):
    """The requested sections for `user`, ready to render or return as JSON.

    Always emitted in SECTION_KEYS order regardless of the order they were
    requested in, so every share of the same customer reads identically.
    """
    wanted = set(sections) if sections else set(SECTION_KEYS)
    return [_SECTION_BUILDERS[key](user) for key in SECTION_KEYS if key in wanted]


def send_profile_dossier_email(*, user, recipient_email, sections=None, note='', shared_by=None):
    """Email the dossier. Raises if the send fails — the caller reports that.

    Unlike the customer-facing booking emails, this one uses `send_html_email`
    rather than the swallowing variant: an admin who pressed "share" needs to
    know the mail did not go out, and there is no surrounding operation that a
    failure would wrongly roll back.
    """
    customer = user.full_name or user.email
    shared_by_label = (shared_by.full_name or shared_by.email) if shared_by else None

    send_html_email(
        to_email=recipient_email,
        subject=f'Fighter profile — {customer}',
        template='emails/profile_dossier.html',
        preheader=f'Profile and fighter card for {customer}.',
        context={
            'heading': customer,
            'customer_name': customer,
            'shared_by': shared_by_label,
            'note': note,
            'sections': build_dossier(user, sections),
            'site_name': getattr(settings, 'EMAIL_SITE_NAME', 'This Is Muay Thai'),
            'footer_note': 'This record was shared with you by the This Is Muay Thai team and '
                           'contains confidential personal and medical information. Please treat '
                           'it accordingly and do not forward it.',
        },
    )
