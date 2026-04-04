from rest_framework import generics, permissions, status, response, viewsets
from rest_framework.decorators import action
from .serializers import UserSerializer, AdminUserSerializer
from core.permissions import IsAdmin
from .models import User

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
    http_method_names = ['get', 'patch', 'delete']

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
            return response.Response({'error': 'Role project is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.role = role
        user.save()
        return response.Response(self.get_serializer(user).data)
