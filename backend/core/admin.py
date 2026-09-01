from django.contrib import admin

from .models import PopupImage


@admin.register(PopupImage)
class PopupImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'alt_text')
