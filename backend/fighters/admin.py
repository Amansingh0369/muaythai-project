from django.contrib import admin
from django.utils.html import format_html

from .models import FighterCard


@admin.register(FighterCard)
class FighterCardAdmin(admin.ModelAdmin):
    list_display = ('user', 'camp', 'nationality', 'training_duration',
                    'cardio_level', 'coach_intensity', 'is_complete', 'updated_at')
    list_filter = ('is_complete', 'camp', 'training_duration', 'cardio_level',
                   'injury_status', 'train_around_limitations')
    search_fields = ('user__email', 'user__full_name', 'city')
    readonly_fields = ('profile_medical', 'is_complete', 'completed_at', 'created_at', 'updated_at')
    autocomplete_fields = ('camp',)
    fieldsets = (
        ('Fighter', {'fields': ('user', 'camp', 'nationality', 'city')}),
        ('Training background', {'fields': (
            'training_duration', 'training_frequency', 'trained_in_thailand',
            'thailand_trips', 'other_combat_sports', 'competition_experience',
            'fight_count', 'sparring_experience',
        )}),
        ('Current fitness', {'fields': (
            'exercise_frequency', 'cardio_level', 'five_round_capability', 'overall_fitness',
        )}),
        ('Goals & style', {'fields': (
            'goals', 'primary_focus', 'primary_focus_notes', 'fighting_styles',
            'favourite_techniques',
        )}),
        # Kept in its own collapsed section for the same reason the form
        # separates it: medical detail should not be on screen by accident.
        ('Injuries & trainer information (private)', {
            'classes': ('collapse',),
            'fields': (
                'injury_status', 'injury_areas', 'injury_notes', 'has_past_major_injury',
                'past_injury_types', 'training_restrictions', 'training_restrictions_notes',
                'has_medical_condition', 'medical_details', 'profile_medical',
                'coach_intensity', 'train_around_limitations', 'message_to_kru',
            ),
        }),
        ('Status', {'fields': ('is_complete', 'completed_at', 'created_at', 'updated_at')}),
    )

    @admin.display(description='From the account profile')
    def profile_medical(self, obj):
        """Medical notes the customer gave at signup, shown beside the card's own.

        Same reason the API detail carries them: medical information reaches us
        by two routes, and a trainer must not have to know to look in both.
        """
        profile = getattr(obj.user, 'profile', None)
        if profile is None:
            return '—'
        conditions = profile.medical_conditions or '—'
        allergies = profile.allergies or '—'
        return format_html(
            '<strong>Medical conditions:</strong> {}<br><strong>Allergies:</strong> {}',
            conditions, allergies,
        )
