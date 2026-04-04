from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from packages.models import Package

class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Review for {self.package.name} by {self.user.email} - {self.rating} stars"

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'package') # One review per package per user
