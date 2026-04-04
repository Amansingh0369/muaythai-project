from rest_framework import viewsets, permissions
from core.permissions import IsAdmin
from .models import Location
from .serializers import LocationSerializer

class LocationViewSet(viewsets.ModelViewSet):
    """
    Location View: List centers (Public), Manage centers (Admin)
    """
    queryset = Location.objects.all().order_by('name')
    serializer_class = LocationSerializer

    def get_permissions(self):
        if self.action == 'list':
            return [permissions.AllowAny()]
        return [IsAdmin()]
