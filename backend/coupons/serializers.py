from rest_framework import serializers

from .models import LOCKED_MESSAGE, LOCKED_ONCE_USED, Coupon, DiscountType


class CouponSerializer(serializers.ModelSerializer):
    """Admin-facing: full coupon record, including redemption counts."""
    is_exhausted = serializers.BooleanField(read_only=True)

    # Surfaced so the admin client can render the locked fields as read-only
    # rather than discovering the rule by getting a 400 back.
    is_used = serializers.BooleanField(read_only=True)
    locked_fields = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = '__all__'
        read_only_fields = ('id', 'times_redeemed', 'created_at', 'updated_at')

    def get_locked_fields(self, obj):
        return list(LOCKED_ONCE_USED) if obj.is_used else []

    def validate_code(self, value):
        code = value.strip().upper()
        if not code:
            raise serializers.ValidationError('Code cannot be blank.')
        clash = Coupon.objects.filter(code=code)
        if self.instance:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError('A coupon with this code already exists.')
        return code

    def validate(self, attrs):
        # Discount terms freeze once any order references the coupon. Compared
        # field by field so a PUT (or a PATCH that re-sends unchanged values)
        # isn't rejected for merely mentioning a locked field.
        if self.instance and self.instance.is_used:
            changed = [
                field for field in LOCKED_ONCE_USED
                if field in attrs and attrs[field] != getattr(self.instance, field)
            ]
            if changed:
                raise serializers.ValidationError({field: LOCKED_MESSAGE for field in changed})

        # Merge with the instance so PATCH validates the resulting record, not
        # just the fields that happen to be in this request.
        merged = {**{f: getattr(self.instance, f, None) for f in (
            'discount_type', 'value', 'max_discount_amount', 'valid_from', 'valid_until',
        )}, **attrs}

        discount_type, value = merged['discount_type'], merged['value']
        if discount_type == DiscountType.PERCENTAGE and value > 100:
            raise serializers.ValidationError(
                {'value': 'A percentage discount cannot exceed 100.'})
        if discount_type == DiscountType.FIXED and merged.get('max_discount_amount'):
            raise serializers.ValidationError(
                {'max_discount_amount': 'A cap only applies to percentage coupons.'})
        if merged.get('valid_from') and merged.get('valid_until') \
                and merged['valid_from'] >= merged['valid_until']:
            raise serializers.ValidationError(
                {'valid_until': 'Must be later than valid_from.'})
        return attrs


class PublicCouponSerializer(serializers.ModelSerializer):
    """Customer-facing: what a code is worth, without exposing supply or limits."""

    class Meta:
        model = Coupon
        fields = ('code', 'description', 'discount_type', 'value')
