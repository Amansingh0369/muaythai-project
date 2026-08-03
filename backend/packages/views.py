from rest_framework import viewsets, permissions, status, response
from rest_framework.decorators import action
from core.permissions import IsAdmin
from reviews.models import Review
from reviews.serializers import ReviewSerializer
from .models import Package, PackageLike
from .serializers import PackageSerializer

class PackageViewSet(viewsets.ModelViewSet):
    """
    Package View: Browse packages (Public), Manage packages (Admin)
    """
    queryset = Package.objects.all()
    serializer_class = PackageSerializer

    def get_queryset(self):
        queryset = Package.objects.all().order_by('price', 'id')

        # Filter by location ID (matches any of the package's M2M locations)
        location_id = self.request.query_params.get('location')
        if location_id:
            queryset = queryset.filter(locations__id=location_id)

        # Filter by kind: INDIVIDUAL | GROUP (case-insensitive)
        kind = self.request.query_params.get('kind')
        if kind:
            queryset = queryset.filter(kind__iexact=kind)

        # Filter by type (case-insensitive)
        package_type = self.request.query_params.get('type')
        if package_type:
            queryset = queryset.filter(type__iexact=package_type)

        # Non-admins only see active packages
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.role == 'ADMIN'):
            queryset = queryset.filter(is_active=True)

        # M2M location filter can produce duplicate rows
        return queryset.distinct()

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'reviews']:
            return [permissions.AllowAny()]
        if self.action == 'like':
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def perform_destroy(self, instance):
        # Orders reference packages via a protected FK, so a package with orders
        # cannot be hard-deleted. Deactivate it instead (kept for order history,
        # hidden from the public since non-admins only see active packages).
        if instance.orders.exists():
            instance.is_active = False
            instance.save(update_fields=['is_active'])
        else:
            instance.delete()

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """
        List all public reviews for this specific package
        """
        package = self.get_object()
        reviews = package.reviews.all()
        serializer = ReviewSerializer(reviews, many=True)
        return response.Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='like')
    def toggle_like(self, request, pk=None):
        """
        Toggle liking a package for the authenticated user
        """
        package = self.get_object()
        like, created = PackageLike.objects.get_or_create(user=request.user, package=package)
        
        if not created:
            # If it already existed, unlike it
            like.delete()
            return response.Response({'status': 'unliked'}, status=status.HTTP_200_OK)
        
        return response.Response({'status': 'liked'}, status=status.HTTP_201_CREATED)
