from rest_framework import viewsets, permissions, status, response
from rest_framework.decorators import action
from .models import Order, OrderStatus
from .serializers import OrderSerializer
from core.permissions import IsAdmin

class OrderViewSet(viewsets.ModelViewSet):
    """
    Order View: Bookings lifecycle
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_queryset(self):
        # Admin sees all, users see only their own
        if self.request.user and self.request.user.is_authenticated:
            if self.request.user.role == 'ADMIN':
                return self.queryset
            return self.queryset.filter(user=self.request.user)
        return self.queryset.none()

    def get_permissions(self):
        if self.action in ['create', 'list_my', 'retrieve', 'cancel']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        package = serializer.validated_data['package']
        # Set user and total_amount from package price
        serializer.save(user=self.request.user, total_amount=package.price)

    @action(detail=False, methods=['get'], url_path='my')
    def list_my(self, request):
        """
        List currently authenticated user's orders
        """
        queryset = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return response.Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        User action to cancel an unfulfilled/pending order
        """
        order = self.get_object()
        if order.status != OrderStatus.PENDING:
            return response.Response(
                {'error': f'Cannot cancel order with status: {order.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = OrderStatus.CANCELLED
        order.save()
        return response.Response(self.get_serializer(order).data)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """
        Admin action to update order status
        """
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in OrderStatus.values:
            return response.Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = new_status
        order.save()
        return response.Response(self.get_serializer(order).data)
