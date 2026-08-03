from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver

class Location(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    city = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.city}"


class LocationImage(models.Model):
    """A single image belonging to a Location. A location can have many."""
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, related_name='images'
    )
    image = models.ImageField(upload_to='locations/')
    caption = models.CharField(max_length=255, null=True, blank=True)
    # Lower values sort first; lets admins control gallery ordering.
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position', 'id']

    def __str__(self):
        return f"Image for {self.location.name} (#{self.pk})"


@receiver(post_delete, sender=LocationImage)
def delete_location_image_file(sender, instance, **kwargs):
    """Remove the backing file from storage (S3) when the row is deleted.

    QuerySet.delete() (used for remove_image_ids and Location cascade) does not
    call FieldFile.delete(), so without this the S3 object would be orphaned.
    """
    if instance.image:
        instance.image.delete(save=False)
