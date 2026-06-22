from django.db import models
from django.conf import settings
from locations.models import Location

class PackageType(models.TextChoices):
    BEGINNER = 'BEGINNER', 'Beginner'
    INTERMEDIATE = 'INTERMEDIATE', 'Intermediate'
    ADVANCED = 'ADVANCED', 'Advanced'

class Package(models.Model):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=PackageType.choices, default=PackageType.BEGINNER)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField(null=True, blank=True)
    duration_days = models.PositiveIntegerField(help_text="7 for Beginner, 14 for Intermediate, 28 for Advanced", null=True, blank=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='packages')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.type == PackageType.BEGINNER:
            self.duration_days = 7
        elif self.type == PackageType.INTERMEDIATE:
            self.duration_days = 14
        elif self.type == PackageType.ADVANCED:
            self.duration_days = 28
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.duration_days} days) - {self.location.name}"

class PackageLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='package_likes')
    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'package') # Prevent double liking
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} liked {self.package.name}"
