from django.db import transaction
from rest_framework import viewsets, permissions, status, response
from rest_framework.decorators import action
from .models import Order, OrderStatus
from .serializers import OrderSerializer
from core.permissions import IsAdmin
from coupons.models import Coupon

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
        if self.action in ['create', 'list_my', 'retrieve', 'cancel',
                           'apply_coupon', 'remove_coupon']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        package = serializer.validated_data['package']
        # Orders always start at full price; a coupon is applied afterwards via
        # the apply-coupon action, which is the only path that sets a discount.
        serializer.save(
            user=self.request.user,
            subtotal_amount=package.price,
            total_amount=package.price,
        )

    @action(detail=True, methods=['post'], url_path='apply-coupon')
    def apply_coupon(self, request, pk=None):
        """Apply a coupon code to a pending order and re-price it.

        Applying does not reserve supply: `times_redeemed` only moves when a
        payment succeeds. Two customers can therefore hold the last redemption
        of a coupon at the same time, and both will get it. That is deliberate —
        the alternative is letting abandoned carts sit on stock.
        """
        code = str(request.data.get('code', '')).strip().upper()
        if not code:
            return response.Response(
                {'error': 'A coupon code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            order = self._locked_order()

            if order.status != OrderStatus.PENDING:
                return response.Response(
                    {'error': f'Cannot change a coupon on an order with status: {order.status}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                coupon = Coupon.objects.get(code=code)
            except Coupon.DoesNotExist:
                return response.Response(
                    {'error': 'This coupon code is not valid.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            reason = coupon.unusable_reason(order.package.price)
            if reason:
                return response.Response({'error': reason}, status=status.HTTP_400_BAD_REQUEST)

            order.coupon = coupon
            self._reprice(order)

        return response.Response(self.get_serializer(order).data)

    @action(detail=True, methods=['post'], url_path='remove-coupon')
    def remove_coupon(self, request, pk=None):
        """Drop the coupon from a pending order and restore full price."""
        with transaction.atomic():
            order = self._locked_order()

            if order.status != OrderStatus.PENDING:
                return response.Response(
                    {'error': f'Cannot change a coupon on an order with status: {order.status}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not order.coupon_id:
                return response.Response(
                    {'error': 'No coupon is applied to this order.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            order.coupon = None
            self._reprice(order)

        return response.Response(self.get_serializer(order).data)

    def _locked_order(self):
        """Re-fetch the order under a row lock, after get_object() has authorised it.

        `of=('self',)` is required, not a refinement: `coupon` is nullable, so
        select_related joins it with a LEFT OUTER JOIN, and Postgres rejects a
        bare FOR UPDATE that reaches the nullable side of an outer join. Scoping
        the lock to the order row also stops a re-price from locking the package
        and coupon rows, which would needlessly serialise unrelated orders that
        happen to share a package.
        """
        return (
            Order.objects
            .select_for_update(of=('self',))
            .select_related('package', 'coupon')
            .get(pk=self.get_object().pk)
        )

    @staticmethod
    def _reprice(order):
        """Recompute totals and invalidate any Razorpay order already created.

        Clearing razorpay_order_id is the important half: that order is locked
        to the old amount at Razorpay, so leaving it attached would let a
        customer authorise a discounted amount and then remove the coupon.
        """
        order.recalculate_totals()
        order.razorpay_order_id = None
        order.save(update_fields=[
            'coupon', 'subtotal_amount', 'discount_amount', 'total_amount',
            'razorpay_order_id', 'updated_at',
        ])

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
