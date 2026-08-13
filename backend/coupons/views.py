from rest_framework import permissions, response, status, viewsets
from rest_framework.decorators import action

from core.permissions import IsAdmin
from packages.models import Package

from .models import Coupon
from .serializers import CouponSerializer, PublicCouponSerializer


class CouponViewSet(viewsets.ModelViewSet):
    """Admin CRUD over discount codes, plus a customer-facing preview.

    Everything except `preview` is admin-only: the full record exposes
    redemption counts and limits, which customers have no business seeing.
    """
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer

    def get_permissions(self):
        if self.action == 'preview':
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    @action(detail=False, methods=['post'], url_path='preview')
    def preview(self, request):
        """Check a code against a package before an order exists.

        Lets the checkout screen show the discount without creating anything.
        This is a preview only — the authoritative calculation happens again
        when the coupon is applied to an order, and again at payment.
        """
        code = str(request.data.get('code', '')).strip().upper()
        package_id = request.data.get('package_id')
        if not code or not package_id:
            return response.Response(
                {'error': 'Both code and package_id are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            package = Package.objects.get(id=package_id)
        except (Package.DoesNotExist, ValueError, TypeError):
            return response.Response(
                {'error': 'Package not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            # Deliberately identical to the "unusable" shape below so probing
            # cannot distinguish a wrong code from an expired one.
            return response.Response(
                {'valid': False, 'error': 'This coupon code is not valid.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = coupon.unusable_reason(package.price)
        if reason:
            return response.Response(
                {'valid': False, 'error': reason}, status=status.HTTP_400_BAD_REQUEST)

        discount = coupon.compute_discount(package.price)
        return response.Response({
            'valid': True,
            'coupon': PublicCouponSerializer(coupon).data,
            'subtotal_amount': package.price,
            'discount_amount': discount,
            'total_amount': package.price - discount,
        })
