from drf_spectacular.utils import extend_schema
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from core.permissions import IsAdmin

from .models import PopupImage
from .serializers import PopupImageSerializer


class PopupImageViewSet(viewsets.ModelViewSet):
    """The image library behind the site's first-visit popup.

    Everything here is admin-only except `active`, which is what the public
    site calls to find out which poster to render.
    """

    queryset = PopupImage.objects.all()
    serializer_class = PopupImageSerializer
    # Multipart for the upload itself; JSON for metadata-only edits.
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action == 'active':
            return [permissions.AllowAny()]
        return [IsAdmin()]

    @extend_schema(
        responses={200: PopupImageSerializer},
        description='The image the popup should show, or null when the popup '
                    'is switched off. Public — no authentication required.',
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        # null rather than a 404/204 so the caller can do `await res.json()`
        # unconditionally and treat "no popup" as an ordinary value.
        image = PopupImage.objects.filter(is_active=True).first()
        if image is None:
            return Response(None)
        return Response(self.get_serializer(image).data)

    @extend_schema(request=None, responses={200: PopupImageSerializer})
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Make this the current popup image, standing down any other."""
        image = self.get_object()
        image.activate()
        return Response(self.get_serializer(image).data)

    @extend_schema(request=None, responses={200: PopupImageSerializer})
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Switch the popup off, keeping this image in the library."""
        image = self.get_object()
        image.deactivate()
        return Response(self.get_serializer(image).data)
