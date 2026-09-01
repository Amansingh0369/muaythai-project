from rest_framework import serializers
from .models import Order, OrderParticipant
from .participants import clean_guest_list
from packages.serializers import PackageSerializer


class OrderParticipantSerializer(serializers.ModelSerializer):
    """One person a booking covers, as the client sees them.

    Carries `fighter_card_complete` so a checkout or bookings page can show the
    buyer who on their booking still has a card to finish — the same thing the
    confirmation email nudges each participant about.
    """
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    fighter_card_complete = serializers.SerializerMethodField()

    class Meta:
        model = OrderParticipant
        fields = ('id', 'user_id', 'full_name', 'email', 'is_buyer', 'fighter_card_complete')
        read_only_fields = fields

    def get_fighter_card_complete(self, participant) -> bool:
        # A reverse one-to-one raises rather than returning None when there is
        # no card; Django makes that exception an AttributeError too, so the
        # getattr default covers "no card started yet".
        card = getattr(participant.user, 'fighter_card', None)
        return bool(card and card.is_complete)


class GuestSerializer(serializers.Serializer):
    """A friend the buyer is booking for.

    Only a name and an address: everything else about them belongs to their own
    account and their own fighter card, which they fill in themselves.
    """
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()


class OrderSerializer(serializers.ModelSerializer):
    package_details = PackageSerializer(source='package', read_only=True)
    package_name = serializers.CharField(source='package.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    coupon_code = serializers.CharField(source='coupon.code', read_only=True, default=None)
    # Read: everyone the booking covers, buyer first. Write: just the friends —
    # the buyer is added automatically and cannot be left off.
    participants = OrderParticipantSerializer(many=True, read_only=True)
    participant_count = serializers.IntegerField(read_only=True)
    guests = GuestSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Order
        fields = '__all__'
        # Pricing is derived server-side from the package, the participant count
        # and any applied coupon; a client can never post its own amounts.
        read_only_fields = ('id', 'user', 'subtotal_amount', 'discount_amount', 'total_amount',
                            'coupon', 'status', 'razorpay_order_id', 'created_at', 'updated_at')

    def validate(self, attrs):
        # Object-level rather than `validate_guests`, so the errors this raises
        # land under `guests` at the top of the response instead of nested a
        # second time inside it.
        if 'guests' in attrs:
            # Guests are only accepted when the booking is placed. Changing them
            # later has to re-price the order and invalidate the amount already
            # authorised at the gateway, which is what the participants endpoint
            # does — a plain PATCH would silently skip both.
            if self.instance is not None:
                raise serializers.ValidationError({'guests': [
                    'Use PUT /api/orders/{id}/participants/ to change who a booking covers.',
                ]})
            attrs['guests'] = clean_guest_list(
                attrs['guests'], buyer=self.context['request'].user)
        return attrs
