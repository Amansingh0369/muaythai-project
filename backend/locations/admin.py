from django.contrib import admin
from .models import Location, LocationImage


class LocationImageInline(admin.TabularInline):
    model = LocationImage
    extra = 1
    fields = ('image', 'caption', 'position')


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'created_at')
    search_fields = ('name', 'city', 'address')
    inlines = [LocationImageInline]


@admin.register(LocationImage)
class LocationImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'location', 'caption', 'position', 'created_at')
    list_filter = ('location',)
