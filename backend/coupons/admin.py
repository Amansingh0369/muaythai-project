from django.contrib import admin

from .models import LOCKED_ONCE_USED, Coupon


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'value', 'times_redeemed',
                    'max_redemptions', 'is_active', 'valid_until')
    list_filter = ('discount_type', 'is_active')
    search_fields = ('code', 'description')
    readonly_fields = ('times_redeemed', 'created_at', 'updated_at')

    def get_readonly_fields(self, request, obj=None):
        """Grey out the frozen fields on a coupon that orders already reference,
        so the rule is visible rather than only enforced on save."""
        fields = list(super().get_readonly_fields(request, obj))
        if obj and obj.is_used:
            fields.extend(LOCKED_ONCE_USED)
        return fields
