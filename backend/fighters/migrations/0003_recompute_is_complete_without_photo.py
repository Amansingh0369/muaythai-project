from django.db import migrations, models


def clear_stale_completion(apps, schema_editor):
    """Un-complete cards that are only complete because they predate the photo.

    `photo` has joined REQUIRED_FOR_COMPLETION, but `is_complete` is
    denormalised and recomputed only on save, so rows written before this
    would keep a stale `True` — and report `is_complete: true` alongside
    `missing_fields: ["photo"]` until something happened to touch them.

    `completed_at` is deliberately left alone: it records when the card was
    first usable and never moves, the same as for every other answer.
    """
    FighterCard = apps.get_model('fighters', 'FighterCard')
    FighterCard.objects.filter(is_complete=True).filter(
        models.Q(photo='') | models.Q(photo__isnull=True)
    ).update(is_complete=False)


class Migration(migrations.Migration):

    dependencies = [
        ('fighters', '0002_fightercard_photo'),
    ]

    operations = [
        # Nothing to restore going backwards: the flag is derived, and the
        # previous rules recompute it on the next save.
        migrations.RunPython(clear_stale_completion, migrations.RunPython.noop),
    ]
