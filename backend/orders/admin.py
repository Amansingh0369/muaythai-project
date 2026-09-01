from django.contrib import admin

from .models import Order, OrderParticipant


class OrderParticipantInline(admin.TabularInline):
    """Who a booking covers, shown on the order itself.

    Read-only: the participant list is what the order was priced on, so
    changing it here would leave a paid booking charging for a different number
    of people than it covers. Corrections belong in a refund, not an edit.
    """
    model = OrderParticipant
    extra = 0
    can_delete = False
    fields = ('user', 'full_name', 'email', 'is_buyer', 'fighter_card_complete')
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False

    @admin.display(boolean=True, description='Fighter card complete')
    def fighter_card_complete(self, participant):
        card = getattr(participant.user, 'fighter_card', None)
        return bool(card and card.is_complete)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'package', 'covers', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'package')
    search_fields = ('id', 'user__email', 'participants__email')
    readonly_fields = ('subtotal_amount', 'discount_amount', 'total_amount', 'razorpay_order_id',
                       'created_at', 'updated_at')
    inlines = [OrderParticipantInline]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'package')

    @admin.display(description='Covers')
    def covers(self, order):
        count = order.participant_count
        return '1 fighter' if count == 1 else f'{count} fighters'
