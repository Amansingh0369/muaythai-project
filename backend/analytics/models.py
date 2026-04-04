from django.db import models
from django.conf import settings

class Visit(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    path = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        user_info = self.user.email if self.user else "Anonymous"
        return f"Visit by {user_info} to {self.path} at {self.timestamp}"

    class Meta:
        ordering = ['-timestamp']
