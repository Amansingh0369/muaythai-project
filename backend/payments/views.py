from rest_framework import viewsets, permissions, status, response
from rest_framework.decorators import action
from .models import Payment, PaymentStatus
from .serializers import PaymentSerializer, RazorpayOrderSerializer, RazorpayVerifySerializer
from .services import RazorpayService
from orders.models import Order, OrderStatus
from core.permissions import IsAdmin

class PaymentViewSet(viewsets.ModelViewSet):
    """
    Payment View: Razorpay logic & history
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    razorpay_service = RazorpayService()

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            if self.request.user.role == 'ADMIN':
                return self.queryset
            return self.queryset.filter(order__user=self.request.user)
        return self.queryset.none()

    def get_permissions(self):
        if self.action in ['create_razorpay_order', 'verify_payment', 'history']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    @action(detail=False, methods=['post'], url_path='create-order')
    def create_razorpay_order(self, request):
        """
        Main logic to initialize a Razorpay order from a Django order
        """
        serializer = RazorpayOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            order = Order.objects.get(id=serializer.validated_data['order_id'], user=request.user)
        except Order.DoesNotExist:
            return response.Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if order.status != OrderStatus.PENDING:
            return response.Response({'error': 'Order is not in pending status'}, status=status.HTTP_400_BAD_REQUEST)

        # Create Razorpay Order
        razorpay_order = self.razorpay_service.create_order(amount=float(order.total_amount))
        
        # Save razorpay_order_id to Order
        order.razorpay_order_id = razorpay_order['id']
        order.save()

        return response.Response({
            'razorpay_order_id': razorpay_order['id'],
            'amount': razorpay_order['amount'],
            'currency': razorpay_order['currency'],
            'order_id': order.id
        })

    @action(detail=False, methods=['post'], url_path='verify')
    def verify_payment(self, request):
        """
        Verify the payment signature and update order/payment records
        """
        serializer = RazorpayVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Verify Signature
        verified = self.razorpay_service.verify_payment_signature(
            data['razorpay_order_id'],
            data['razorpay_payment_id'],
            data['razorpay_signature']
        )
        
        if not verified:
            return response.Response({'error': 'Signature verification failed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update Order and Create Payment record
        try:
            order = Order.objects.get(razorpay_order_id=data['razorpay_order_id'])
            order.status = OrderStatus.PAID
            order.save()
            
            Payment.objects.create(
                order=order,
                razorpay_payment_id=data['razorpay_payment_id'],
                razorpay_order_id=data['razorpay_order_id'],
                razorpay_signature=data['razorpay_signature'],
                amount=order.total_amount,
                status=PaymentStatus.SUCCESS
            )
            
            return response.Response({'message': 'Payment successful', 'order_id': order.id})
        except Order.DoesNotExist:
            return response.Response({'error': 'Order not found for given razorpay_order_id'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='history')
    def history(self, request):
        """
        List personal payment history
        """
        queryset = self.get_queryset().filter(order__user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return response.Response(serializer.data)
