import logging

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import exceptions, generics, permissions, status, response, viewsets
from rest_framework.decorators import action
from .serializers import (
    AdminUserSerializer,
    ProfileShareSerializer,
    ShareProfileSerializer,
    UserSerializer,
)
from .sharing import SECTION_KEYS, build_dossier, send_profile_dossier_email
from core.permissions import IsAdmin
from .models import ProfileShare, User

logger = logging.getLogger(__name__)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    User View: Manage own profile
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserAdminViewSet(viewsets.ModelViewSet):
    """
    Admin View: Manage all users
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    # POST is allowed only so the `share` action can use it; see create() below.
    http_method_names = ['get', 'post', 'patch', 'delete']

    def create(self, request, *args, **kwargs):
        # Accounts are created through /api/auth/register/, never here. Without
        # this, allowing POST for the share action would quietly expose
        # ModelViewSet's user-creation endpoint.
        raise exceptions.MethodNotAllowed('POST')

    def perform_destroy(self, instance):
        # Soft delete: Deactivate the user
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['patch'], url_path='role')
    def change_role(self, request, pk=None):
        """
        Specialized endpoint to change user role
        """
        user = self.get_object()
        role = request.data.get('role')
        if not role:
            return response.Response({'error': 'Role field is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.role = role
        user.save()
        return response.Response(self.get_serializer(user).data)

    def _requested_sections(self, raw):
        """Validate a comma-separated `sections` query parameter.

        Returns None for "not specified", which `build_dossier` reads as
        "every section".
        """
        if not raw:
            return None
        keys = [key.strip() for key in raw.split(',') if key.strip()]
        unknown = [key for key in keys if key not in SECTION_KEYS]
        if unknown:
            raise ValueError(
                f"Unknown section(s): {', '.join(unknown)}. "
                f"Valid sections are: {', '.join(SECTION_KEYS)}."
            )
        return keys or None

    @extend_schema(
        parameters=[OpenApiParameter(
            name='sections', description='Comma-separated subset of: ' + ', '.join(SECTION_KEYS),
            required=False, type=str,
        )],
        responses={200: dict},
        description='The dossier that sharing this customer would send, as JSON.',
    )
    @action(detail=True, methods=['get'], url_path='share/preview')
    def share_preview(self, request, pk=None):
        """What a share would send, so the dashboard can show it before sending.

        The point is that confidential material never leaves on a guess: an
        admin sees the exact contents, for the exact sections, first.
        """
        user = self.get_object()
        try:
            sections = self._requested_sections(request.query_params.get('sections'))
        except ValueError as exc:
            return response.Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return response.Response({
            'user': user.id,
            'customer_email': user.email,
            'sections': build_dossier(user, sections),
        })

    @extend_schema(request=ShareProfileSerializer, responses={201: ProfileShareSerializer})
    @action(detail=True, methods=['post'], url_path='share')
    def share(self, request, pk=None):
        """Email this customer's dossier to an outside address, and record it.

        The dossier carries confidential personal and medical information, so
        this is admin-only and every successful send leaves a `ProfileShare` row.
        """
        user = self.get_object()
        serializer = ShareProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        sections = data.get('sections') or list(SECTION_KEYS)

        try:
            send_profile_dossier_email(
                user=user,
                recipient_email=data['email'],
                sections=sections,
                note=data['note'],
                shared_by=request.user,
            )
        except Exception:
            # Nothing was disclosed, so no audit row is written. The admin is
            # told plainly rather than being left to assume it went out.
            logger.exception('Failed to share profile %s with %s', user.id, data['email'])
            return response.Response(
                {'error': 'The profile could not be emailed. Please try again, and check the '
                          'address if this keeps happening.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        share = ProfileShare.objects.create(
            user=user,
            shared_by=request.user,
            recipient_email=data['email'],
            sections=sections,
            note=data['note'],
        )
        return response.Response(
            ProfileShareSerializer(share).data, status=status.HTTP_201_CREATED,
        )

    @extend_schema(responses={200: ProfileShareSerializer(many=True)})
    @action(detail=True, methods=['get'], url_path='shares')
    def shares(self, request, pk=None):
        """Who this customer's profile has already been shared with."""
        user = self.get_object()
        return response.Response(
            ProfileShareSerializer(user.profile_shares.select_related('shared_by'), many=True).data
        )
