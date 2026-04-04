from rest_framework import viewsets, permissions, status, response, exceptions
from rest_framework.decorators import action
from .models import Review
from .serializers import ReviewSerializer
from core.permissions import IsAdmin
from orders.models import Order, OrderStatus

class ReviewViewSet(viewsets.ModelViewSet):
    """
    Review View: Feedback management
    """
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action in ['list', 'retrieve', 'destroy']: # Added destroy for delete
            return [IsAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        package = serializer.validated_data['package']
        
        has_purchased = Order.objects.filter(
            user=self.request.user,
            package=package,
            status=OrderStatus.PAID
        ).exists()

        if not has_purchased:
            raise exceptions.ValidationError("You can only review packages you have purchased.")

        serializer.save(user=self.request.user)
