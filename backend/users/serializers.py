from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'age', 'gender', 'phone_no', 'role', 'google_id', 'is_active', 'created_at')
        read_only_fields = ('id', 'email', 'role', 'google_id', 'created_at')

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'age', 'gender', 'phone_no', 'role', 'is_active', 'created_at')
        read_only_fields = ('id', 'email', 'created_at')
