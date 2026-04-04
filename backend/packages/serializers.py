from rest_framework import serializers
from .models import Package
from locations.serializers import LocationSerializer

class PackageSerializer(serializers.ModelSerializer):
    location_details = LocationSerializer(source='location', read_only=True)
    
    class Meta:
        model = Package
        fields = '__all__'
        read_only_fields = ('id', 'is_active', 'created_at', 'updated_at')
