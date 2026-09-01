from rest_framework import serializers

from .models import PopupImage


class PopupImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PopupImage
        fields = (
            'id', 'image', 'title', 'alt_text', 'is_active',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            # DRF turns the model's partial unique index into a "this is_active
            # already exists" field validator, which would reject every attempt
            # to switch posters while one is live. Superseding the current image
            # is the whole point, so drop it: the index stays as the race-
            # condition backstop, and activate() clears the old row in time.
            'is_active': {'validators': []},
        }

    def create(self, validated_data):
        # is_active is never written straight through: the partial unique index
        # rejects a second active row, so activation has to go via activate(),
        # which clears the previous holder first.
        make_active = validated_data.pop('is_active', False)
        instance = super().create(validated_data)
        if make_active:
            instance.activate()
        return instance

    def update(self, instance, validated_data):
        make_active = validated_data.pop('is_active', None)
        instance = super().update(instance, validated_data)
        if make_active is True:
            instance.activate()
        elif make_active is False:
            instance.deactivate()
        return instance
