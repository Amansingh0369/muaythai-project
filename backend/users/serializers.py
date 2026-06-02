from rest_framework import serializers
from .models import User, Profile
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
    profile = ProfileSerializer(required=False)
    orders = OrderSummarySerializer(many=True, read_only=True)
    liked_packages = LikedPackageSerializer(source='package_likes', many=True, read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'profile', 'orders', 'liked_packages', 'role', 'google_id', 'is_active', 'created_at')
        read_only_fields = ('id', 'email', 'role', 'google_id', 'created_at', 'orders', 'liked_packages')

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
