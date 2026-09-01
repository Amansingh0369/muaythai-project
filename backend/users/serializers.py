from django.db.models import Q
from rest_framework import serializers
from .models import User, Profile, ProfileShare
from .sharing import SECTION_KEYS
from orders.models import Order
from packages.models import PackageLike

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = (
            'bio', 'profile_picture', 'experience', 'weight', 
            'height', 'medical_conditions', 'allergies', 
            'emergency_contact_name', 'emergency_contact_phone', 
            'passport', 'age', 'gender', 'phone'
        )

class OrderSummarySerializer(serializers.ModelSerializer):
    """A booking as it appears on someone's own profile.

    Written for one viewer at a time: `for_user_id` in the context says who is
    looking, which decides whether they are the buyer and therefore whether the
    amount is any of their business.
    """
    package_name = serializers.CharField(source='package.name', read_only=True)
    is_buyer = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ('id', 'package_name', 'total_amount', 'status', 'created_at',
                  'is_buyer', 'participant_count')

    def get_is_buyer(self, order) -> bool:
        """False when a friend booked this person in rather than the other way round."""
        return order.user_id == self.context.get('for_user_id')

    def get_total_amount(self, order) -> str:
        """Null for a guest: the booking is theirs, the payment is not.

        A group total covers their friend's place as well as their own, so
        showing it would tell them what someone else spent — the same reason
        their confirmation email carries no money.
        """
        return str(order.total_amount) if self.get_is_buyer(order) else None

class LikedPackageSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source='package.name', read_only=True)
    package_id = serializers.IntegerField(source='package.id', read_only=True)
    
    class Meta:
        model = PackageLike
        fields = ('package_id', 'package_name', 'created_at')

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)
    orders = serializers.SerializerMethodField()
    liked_packages = LikedPackageSerializer(source='package_likes', many=True, read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'profile', 'orders', 'liked_packages', 'role', 'google_id', 'is_active', 'created_at')
        read_only_fields = ('id', 'email', 'role', 'google_id', 'created_at', 'orders', 'liked_packages')

    def get_orders(self, user):
        """Bookings this user placed, plus any a friend booked them onto.

        Being booked in by someone else is still being booked in, and the
        profile page is where a guest finds the camp they are joining — listing
        only what they paid for would leave them looking at an empty page.
        """
        orders = (
            Order.objects
            .filter(Q(user=user) | Q(participants__user=user))
            .select_related('package')
            .distinct()
        )
        return OrderSummarySerializer(
            orders, many=True, context={**self.context, 'for_user_id': user.id},
        ).data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        profile = representation.pop('profile', {})
        if profile:
            for key, value in profile.items():
                representation[key] = value
        return representation

    def to_internal_value(self, data):
        if hasattr(data, 'dict'):
            _data = {}
            for key in data.keys():
                if hasattr(data, 'getlist') and len(data.getlist(key)) > 1:
                    _data[key] = data.getlist(key)
                else:
                    _data[key] = data[key]
            data = _data
        else:
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            
        profile_fields = [
            'bio', 'profile_picture', 'experience', 'weight', 
            'height', 'medical_conditions', 'allergies', 
            'emergency_contact_name', 'emergency_contact_phone', 
            'passport', 'age', 'gender', 'phone'
        ]
        
        profile_data = {}
        for field in profile_fields:
            if field in data:
                profile_data[field] = data.pop(field)
                
        if profile_data:
            data['profile'] = profile_data
            
        return super().to_internal_value(data)

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update Profile fields
        if profile_data:
            profile, _ = Profile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance

class AdminUserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'profile', 'role', 'is_active', 'created_at')
        read_only_fields = ('id', 'email', 'created_at')

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        profile = representation.pop('profile', {})
        if profile:
            for key, value in profile.items():
                representation[key] = value
        return representation

    def to_internal_value(self, data):
        if hasattr(data, 'dict'):
            _data = {}
            for key in data.keys():
                if hasattr(data, 'getlist') and len(data.getlist(key)) > 1:
                    _data[key] = data.getlist(key)
                else:
                    _data[key] = data[key]
            data = _data
        else:
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            
        profile_fields = [
            'bio', 'profile_picture', 'experience', 'weight', 
            'height', 'medical_conditions', 'allergies', 
            'emergency_contact_name', 'emergency_contact_phone', 
            'passport', 'age', 'gender', 'phone'
        ]
        
        profile_data = {}
        for field in profile_fields:
            if field in data:
                profile_data[field] = data.pop(field)
                
        if profile_data:
            data['profile'] = profile_data
            
        return super().to_internal_value(data)

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update Profile fields
        if profile_data:
            profile, _ = Profile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance


class ProfileShareSerializer(serializers.ModelSerializer):
    """An audit row: one dossier that was emailed out."""

    shared_by_email = serializers.EmailField(source='shared_by.email', read_only=True, default=None)

    class Meta:
        model = ProfileShare
        fields = ('id', 'user', 'recipient_email', 'sections', 'note',
                  'shared_by', 'shared_by_email', 'created_at')
        read_only_fields = fields


class ShareProfileSerializer(serializers.Serializer):
    """What an admin submits to share a customer's dossier by email."""

    email = serializers.EmailField()
    #: Defaults to every section. Naming a subset is how a share is kept to
    #: what the recipient actually needs — see `users.sharing`.
    sections = serializers.ListField(
        child=serializers.ChoiceField(choices=SECTION_KEYS),
        required=False,
        allow_empty=False,
    )
    #: Optional covering message, shown above the dossier.
    note = serializers.CharField(required=False, allow_blank=True, max_length=2000, default='')

    def validate_sections(self, value):
        # Deduplicate but do not reorder: build_dossier emits SECTION_KEYS order
        # regardless, so the stored list should read the same way.
        return [key for key in SECTION_KEYS if key in set(value)]
