from django.db import models, transaction
from django.db.models.signals import post_delete
from django.dispatch import receiver


class PopupImage(models.Model):
    """One image in the library behind the site's first-visit popup.

    The library keeps every poster an admin has uploaded and marks at most one
    of them `is_active` — that one is what the public popup renders. Storing a
    library rather than overwriting a single row is the point: switching back
    to last month's poster is then one click instead of a re-upload.

    "At most one active" is a partial unique index, not just serializer
    discipline, so two admins activating different images at the same moment
    cannot both win. Because that index rejects a second active row outright,
    every activation must clear the current holder first — go through
    `activate()`, never `is_active = True` on its own.
    """

    image = models.ImageField(upload_to='popup/')
    #: Admin-facing label, for telling entries apart in the dashboard library.
    title = models.CharField(max_length=255, blank=True)
    #: Rendered as the <img> alt text, so it should describe the poster itself.
    alt_text = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Newest first: the dashboard library reads as an upload history.
        ordering = ['-created_at', '-id']
        constraints = [
            models.UniqueConstraint(
                fields=['is_active'],
                condition=models.Q(is_active=True),
                name='unique_active_popup_image',
            ),
        ]

    def __str__(self):
        return self.title or f'Popup image #{self.pk}'

    @transaction.atomic
    def activate(self):
        """Make this the image the popup shows, standing down any other.

        The previous holder is cleared first because the partial unique index
        would reject a second active row — the ordering matters even though
        both statements land in the same transaction.
        """
        PopupImage.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        if not self.is_active:
            self.is_active = True
            self.save(update_fields=['is_active', 'updated_at'])

    def deactivate(self):
        """Stop showing this image, leaving the popup with no image at all."""
        if self.is_active:
            self.is_active = False
            self.save(update_fields=['is_active', 'updated_at'])


@receiver(post_delete, sender=PopupImage)
def delete_popup_image_file(sender, instance, **kwargs):
    """Remove the backing file from storage (S3) when the row is deleted.

    QuerySet.delete() does not call FieldFile.delete(), so without this a bulk
    delete would leave the S3 object orphaned.
    """
    if instance.image:
        instance.image.delete(save=False)
