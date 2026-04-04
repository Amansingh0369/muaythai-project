from django.db import models
from django.conf import settings
from locations.models import Location

class Package(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.PositiveIntegerField()
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='packages')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
