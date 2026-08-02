from django.db import models
from django.conf import settings
from locations.models import Location

class PackageType(models.TextChoices):
    BEGINNER = 'BEGINNER', 'Beginner'
    INTERMEDIATE = 'INTERMEDIATE', 'Intermediate'
    ADVANCED = 'ADVANCED', 'Advanced'

class PackageKind(models.TextChoices):
    INDIVIDUAL = 'INDIVIDUAL', 'Individual'  # Single location
    GROUP = 'GROUP', 'Group'                  # Spans multiple locations

class Package(models.Model):
    name = models.CharField(max_length=255)
    kind = models.CharField(max_length=20, choices=PackageKind.choices, default=PackageKind.INDIVIDUAL)
    type = models.CharField(max_length=20, choices=PackageType.choices, default=PackageType.BEGINNER)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField(null=True, blank=True)
    duration_days = models.PositiveIntegerField(help_text="Total program duration in days", null=True, blank=True)
    # Individual packages have exactly one location; group packages span several.
    locations = models.ManyToManyField(Location, related_name='packages', blank=True)
    # Descriptive bullet-list sections. Each is a list of strings, e.g. ["Complete Beginners", "Solo Travelers"].
    ideal_for = models.JSONField(default=list, blank=True, help_text="List of bullet points for 'Ideal For'")
    training = models.JSONField(default=list, blank=True, help_text="List of bullet points for 'Training'")
    experience = models.JSONField(default=list, blank=True, help_text="List of bullet points for 'Experience'")
    accommodation = models.JSONField(default=list, blank=True, help_text="List of bullet points for 'Accommodation'")
    included = models.JSONField(default=list, blank=True, help_text="List of bullet points for 'Included'")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_kind_display()}, {self.duration_days} days)"

class PackageLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='package_likes')
    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'package') # Prevent double liking
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} liked {self.package.name}"
