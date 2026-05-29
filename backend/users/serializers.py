from rest_framework import serializers
from .models import User, Profile
from orders.models import Order
from packages.models import PackageLike

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = (
            'bio', 'profile_picture', 'experience_level', 'weight_kg', 
            'height_cm', 'medical_conditions', 'allergies', 
            'emergency_contact_name', 'emergency_contact_phone', 
            'passport_number', 'age', 'gender', 'phone_no'
        )

class OrderSummarySerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source='package.name', read_only=True)
    
    class Meta:
        model = Order
        fields = ('id', 'package_name', 'total_amount', 'status', 'created_at')

class LikedPackageSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source='package.name', read_only=True)
    package_id = serializers.IntegerField(source='package.id', read_only=True)
    
    class Meta:
        model = PackageLike
        fields = ('package_id', 'package_name', 'created_at')

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()
    orders = OrderSummarySerializer(many=True, read_only=True)
    liked_packages = LikedPackageSerializer(source='package_likes', many=True, read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'profile', 'orders', 'liked_packages', 'role', 'google_id', 'is_active', 'created_at')
        read_only_fields = ('id', 'email', 'role', 'google_id', 'created_at', 'orders', 'liked_packages')

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
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'profile', 'role', 'is_active', 'created_at')
        read_only_fields = ('id', 'email', 'created_at')

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
