import logging

from django.conf import settings
from django.db import transaction
from rest_framework import viewsets, permissions, status, response
from rest_framework.decorators import action
from .models import Payment, PaymentStatus
from .serializers import PaymentSerializer, RazorpayOrderSerializer, RazorpayVerifySerializer
from .services import RazorpayService
from orders.emails import send_order_confirmation_email, send_payment_failed_email
from orders.models import Order, OrderStatus
from core.permissions import IsAdmin

logger = logging.getLogger(__name__)

class PaymentViewSet(viewsets.ModelViewSet):
    """
    Payment View: Razorpay logic & history
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    @property
    def razorpay_service(self):
        # Lazily build the client so a missing/invalid key never breaks app startup
        if not hasattr(self, '_razorpay_service'):
            self._razorpay_service = RazorpayService()
        return self._razorpay_service

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

        amount_in_paise = int(round(float(order.total_amount) * 100))

        # Reuse an existing Razorpay order when one is already attached and still
        # matches the amount — avoids orphaning a fresh order on every retry.
        razorpay_order = None
        if order.razorpay_order_id:
            try:
                existing = self.razorpay_service.fetch_order(order.razorpay_order_id)
                if existing.get('status') == 'created' and existing.get('amount') == amount_in_paise:
                    razorpay_order = existing
            except Exception:
                razorpay_order = None

        if razorpay_order is None:
            razorpay_order = self.razorpay_service.create_order(amount=float(order.total_amount))
            order.razorpay_order_id = razorpay_order['id']
            order.save(update_fields=['razorpay_order_id', 'updated_at'])

        return response.Response({
            'razorpay_key_id': settings.RAZORPAY_KEY_ID,
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
            self._record_failed_payment(
                user=request.user,
                data=data,
                reason='We could not verify the payment signature returned by our payment provider.',
            )
            return response.Response({'error': 'Signature verification failed'}, status=status.HTTP_400_BAD_REQUEST)

        # Update Order and create the Payment record atomically. Locking the row
        # keeps concurrent verify calls from double-creating payments.
        try:
            with transaction.atomic():
                order = Order.objects.select_for_update().get(
                    razorpay_order_id=data['razorpay_order_id'],
                    user=request.user,
                )

                # Idempotent: a replayed verify for an already-paid order is a no-op
                if order.status == OrderStatus.PAID:
                    return response.Response({'message': 'Payment already verified', 'order_id': order.id})

                if order.status != OrderStatus.PENDING:
                    return response.Response(
                        {'error': f'Order cannot be paid from status: {order.status}'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                order.status = OrderStatus.PAID
                order.save(update_fields=['status', 'updated_at'])

                payment = Payment.objects.create(
                    order=order,
                    razorpay_payment_id=data['razorpay_payment_id'],
                    razorpay_order_id=data['razorpay_order_id'],
                    razorpay_signature=data['razorpay_signature'],
                    amount=order.total_amount,
                    status=PaymentStatus.SUCCESS,
                )

                # on_commit so the receipt is only sent once the payment is
                # durably recorded — a rolled-back transaction must not leave the
                # customer holding a confirmation for a booking that doesn't exist.
                transaction.on_commit(
                    lambda: send_order_confirmation_email(order=order, payment=payment)
                )

            return response.Response({'message': 'Payment successful', 'order_id': order.id})
        except Order.DoesNotExist:
            return response.Response({'error': 'Order not found for given razorpay_order_id'}, status=status.HTTP_404_NOT_FOUND)

    def _record_failed_payment(self, *, user, data, reason):
        """Log a failed attempt against the order and let the customer know.

        The order is deliberately left PENDING so the customer can retry from
        the same booking. Never raises: a failure here must not mask the
        payment error we are already returning to the caller.
        """
        try:
            order = Order.objects.select_related('package', 'user').get(
                razorpay_order_id=data['razorpay_order_id'],
                user=user,
            )
        except Order.DoesNotExist:
            logger.warning(
                'Failed payment for unknown razorpay_order_id=%s', data.get('razorpay_order_id')
            )
            return

        try:
            Payment.objects.create(
                order=order,
                razorpay_payment_id=data.get('razorpay_payment_id'),
                razorpay_order_id=data['razorpay_order_id'],
                razorpay_signature=data.get('razorpay_signature'),
                amount=order.total_amount,
                status=PaymentStatus.FAILED,
            )
        except Exception:
            logger.exception('Could not record failed payment for order #%s', order.id)

        send_payment_failed_email(order=order, reason=reason)

    @action(detail=False, methods=['get'], url_path='history')
    def history(self, request):
        """
        List personal payment history
        """
        queryset = self.get_queryset().filter(order__user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return response.Response(serializer.data)
