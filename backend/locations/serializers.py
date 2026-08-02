from rest_framework import serializers
from .models import Location, LocationImage


class LocationImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationImage
        fields = ('id', 'image', 'caption', 'position')
        read_only_fields = ('id',)


class LocationSerializer(serializers.ModelSerializer):
    # Read side: the array of images attached to this location.
    images = LocationImageSerializer(many=True, read_only=True)
    # Write side: image files uploaded via multipart (repeat the key per file).
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
    )
    # Write side: ids of existing images to delete on update.
    remove_image_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Location
        fields = (
            'id', 'name', 'address', 'city', 'latitude', 'longitude',
            'images', 'uploaded_images', 'remove_image_ids',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    # Keys that arrive as repeated multipart fields and must be read via getlist.
    _MULTI_VALUE_FIELDS = ('uploaded_images', 'remove_image_ids')

    def to_internal_value(self, data):
        """Expand repeated multipart keys (e.g. uploaded_images) into lists.

        In a multipart request, `data` is a QueryDict where repeated keys are
        only exposed via getlist(); plain dict access returns just the last one.
        We rebuild a normal dict so ListField sees every uploaded file.
        """
        if hasattr(data, 'getlist'):
            normalized = {}
            for key in data.keys():
                if key in self._MULTI_VALUE_FIELDS:
                    normalized[key] = data.getlist(key)
                else:
                    normalized[key] = data.get(key)
            data = normalized
        return super().to_internal_value(data)

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        # remove_image_ids is meaningless on create; drop it if present.
        validated_data.pop('remove_image_ids', None)

        location = super().create(validated_data)
        self._add_images(location, uploaded_images)
        return location

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        remove_image_ids = validated_data.pop('remove_image_ids', [])

        location = super().update(instance, validated_data)

        if remove_image_ids:
            # Scope deletion to this location so callers can't delete others'.
            location.images.filter(id__in=remove_image_ids).delete()

        self._add_images(location, uploaded_images)
        return location

    def _add_images(self, location, image_files):
        """Append the given uploaded files as LocationImage rows.

        New images are positioned after any existing ones so ordering is stable.
        """
        if not image_files:
            return
        start = location.images.count()
        LocationImage.objects.bulk_create([
            LocationImage(location=location, image=image_file, position=start + offset)
            for offset, image_file in enumerate(image_files)
        ])
