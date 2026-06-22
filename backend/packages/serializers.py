from rest_framework import serializers
from .models import Package
from locations.serializers import LocationSerializer

class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'duration_days')
