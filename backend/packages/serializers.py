from rest_framework import serializers
from .models import Package, PackageKind
from locations.models import Location
from locations.serializers import LocationSerializer

# Bullet-list sections that must each be a list of strings.
LIST_SECTIONS = ('ideal_for', 'training', 'experience', 'accommodation', 'included')

class PackageSerializer(serializers.ModelSerializer):
    # Read: full nested location objects. Write: a list of location IDs via `location_ids`.
    locations = LocationSerializer(many=True, read_only=True)
    location_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Location.objects.all(),
        source='locations',
        write_only=True,
        required=False,
    )

    class Meta:
        model = Package
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate(self, attrs):
        self._validate_locations(attrs)
        self._validate_sections(attrs)
        return attrs

    def _validate_locations(self, attrs):
        # `locations` is only present in attrs when location_ids was sent.
        # On update without it, fall back to the instance's current locations.
        if 'locations' in attrs:
            locations = attrs['locations']
        elif self.instance is not None:
            locations = list(self.instance.locations.all())
        else:
            locations = []

        kind = attrs.get('kind', getattr(self.instance, 'kind', PackageKind.INDIVIDUAL))

        if kind == PackageKind.INDIVIDUAL and len(locations) != 1:
            raise serializers.ValidationError(
                {'location_ids': 'An individual package must have exactly one location.'}
            )
        # Group packages are group activities: they may run at a single location
        # or span several, so no location-count rule applies to them.

    def _validate_sections(self, attrs):
        for field in LIST_SECTIONS:
            value = attrs.get(field)
            if value is None:
                continue
            if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
                raise serializers.ValidationError(
                    {field: 'This field must be a list of strings.'}
                )
