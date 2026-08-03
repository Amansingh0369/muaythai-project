from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from core.permissions import IsAdmin
from .models import Location
from .serializers import LocationSerializer

class LocationViewSet(viewsets.ModelViewSet):
    """
    Location View: List centers (Public), Manage centers (Admin)
    """
    # Prefetch images to avoid an N+1 when serializing the images array.
    queryset = Location.objects.prefetch_related('images').order_by('name')
    serializer_class = LocationSerializer
    # Accept multipart (image uploads) as well as JSON (metadata-only edits).
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action == 'list':
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def destroy(self, request, *args, **kwargs):
        location = self.get_object()
        package_count = location.packages.count()
        if package_count:
            return Response(
                {'detail': f'Cannot delete this location: it is attached to {package_count} '
                           f'package(s). Detach it from those packages first.'},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)
