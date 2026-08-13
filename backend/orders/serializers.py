from rest_framework import serializers
from .models import Order
from packages.serializers import PackageSerializer

class OrderSerializer(serializers.ModelSerializer):
    package_details = PackageSerializer(source='package', read_only=True)
    package_name = serializers.CharField(source='package.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    coupon_code = serializers.CharField(source='coupon.code', read_only=True, default=None)

    class Meta:
        model = Order
        fields = '__all__'
        # Pricing is derived server-side from the package and any applied
        # coupon; a client can never post its own amounts.
        read_only_fields = ('id', 'user', 'subtotal_amount', 'discount_amount', 'total_amount',
                            'coupon', 'status', 'razorpay_order_id', 'created_at', 'updated_at')
