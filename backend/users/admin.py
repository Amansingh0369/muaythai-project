from django.contrib import admin

from .models import ProfileShare


@admin.register(ProfileShare)
class ProfileShareAdmin(admin.ModelAdmin):
    """Read-only view of the dossier-sharing audit trail.

    Editable audit rows would defeat the purpose, so this is a log to read,
    not a table to maintain.
    """
    list_display = ('id', 'user', 'recipient_email', 'shared_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('recipient_email', 'user__email', 'shared_by__email')
    readonly_fields = ('user', 'shared_by', 'recipient_email', 'sections', 'note', 'created_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
