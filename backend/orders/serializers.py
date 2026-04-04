from rest_framework import serializers
from .models import Order
from packages.serializers import PackageSerializer

class OrderSerializer(serializers.ModelSerializer):
    package_details = PackageSerializer(source='package', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('id', 'user', 'total_amount', 'status', 'razorpay_order_id', 'created_at', 'updated_at')
