from django.db import transaction
from django.db.models import Q
from rest_framework import exceptions, viewsets, permissions, status, response
from rest_framework.decorators import action
from .models import Order, OrderStatus
from .participants import clean_guest_list, set_participants
from .serializers import GuestSerializer, OrderSerializer
from core.permissions import IsAdmin
from coupons.models import Coupon

class OrderViewSet(viewsets.ModelViewSet):
    """
    Order View: Bookings lifecycle
    """
    # Participants and their cards are serialised on every read, so they are
    # fetched up front rather than one query per person on the booking.
    queryset = Order.objects.select_related('package', 'coupon', 'user').prefetch_related(
        'participants__user__fighter_card', 'package__locations',
    )
    serializer_class = OrderSerializer

    def get_queryset(self):
        # Admin sees all, users see only their own
        if self.request.user and self.request.user.is_authenticated:
            if self.request.user.role == 'ADMIN':
                return self.queryset
            return self._visible_to(self.request.user)
        return self.queryset.none()

    def _visible_to(self, user):
        """Bookings this user can read: the ones they bought, and the ones they
        are on. A friend who was booked for needs to see the camp they are
        joining even though they never paid for it."""
        return self.queryset.filter(Q(user=user) | Q(participants__user=user)).distinct()

    def _require_buyer(self, order):
        """Guarantee the caller is the buyer before changing a booking.

        `get_queryset` deliberately shows a booking to everyone it covers, which
        would otherwise let a guest re-price or cancel a purchase someone else
        made and paid for.
        """
        if order.user_id != self.request.user.id:
            raise exceptions.PermissionDenied(
                'Only the person who placed this booking can change it.')
        return order

    def get_permissions(self):
        if self.action in ['create', 'list_my', 'retrieve', 'cancel',
                           'apply_coupon', 'remove_coupon', 'update_participants']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        """Place the order, then write who it covers and price it accordingly.

        The participants have to exist before the totals do — the subtotal is
        the package price once per person — so the order is saved at zero and
        re-priced in the same transaction rather than being left, even briefly,
        at a price that does not match the booking.
        """
        guests = serializer.validated_data.pop('guests', [])
        with transaction.atomic():
            order = serializer.save(user=self.request.user, total_amount=0)
            set_participants(order=order, buyer=self.request.user, guests=guests)
            # Orders always start at full price; a coupon is applied afterwards
            # via the apply-coupon action, the only path that sets a discount.
            order.recalculate_totals()
            order.save(update_fields=[
                'subtotal_amount', 'discount_amount', 'total_amount', 'updated_at',
            ])

    @action(detail=True, methods=['put'], url_path='participants')
    def update_participants(self, request, pk=None):
        """Replace the guests on a pending order and re-price it.

        Sending `{"guests": []}` empties the booking back down to the buyer
        alone. A coupon that no longer qualifies at the new subtotal — a
        minimum-order code on a booking that just shrank — is dropped rather
        than silently honoured, and the response names it so the customer can
        be told why their total moved more than one place's worth.
        """
        guest_input = GuestSerializer(data=request.data.get('guests', []), many=True)
        guest_input.is_valid(raise_exception=True)
        guests = clean_guest_list(guest_input.validated_data, buyer=request.user)

        with transaction.atomic():
            order = self._require_buyer(self._locked_order())

            if order.status != OrderStatus.PENDING:
                return response.Response(
                    {'error': f'Cannot change who is on an order with status: {order.status}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            set_participants(order=order, buyer=request.user, guests=guests)

            coupon_removed = None
            if order.coupon:
                new_subtotal = order.package.price * (len(guests) + 1)
                if order.coupon.unusable_reason(new_subtotal):
                    coupon_removed = order.coupon.code
                    order.coupon = None

            self._reprice(order)

        data = self.get_serializer(order).data
        data['coupon_removed'] = coupon_removed
        return response.Response(data)

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
            order = self._require_buyer(self._locked_order())

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

            # Tested against the whole booking, not one place on it: a
            # minimum-order code is about what the customer spends, and a group
            # booking for three genuinely spends three times as much.
            reason = coupon.unusable_reason(order.subtotal_amount)
            if reason:
                return response.Response({'error': reason}, status=status.HTTP_400_BAD_REQUEST)

            order.coupon = coupon
            self._reprice(order)

        return response.Response(self.get_serializer(order).data)

    @action(detail=True, methods=['post'], url_path='remove-coupon')
    def remove_coupon(self, request, pk=None):
        """Drop the coupon from a pending order and restore full price."""
        with transaction.atomic():
            order = self._require_buyer(self._locked_order())

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
        customer authorise a discounted amount and then remove the coupon — or
        authorise one place and then add three friends.
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
        List the bookings the current user placed or is a participant on
        """
        serializer = self.get_serializer(self._visible_to(request.user), many=True)
        return response.Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        User action to cancel an unfulfilled/pending order
        """
        order = self._require_buyer(self.get_object())
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
