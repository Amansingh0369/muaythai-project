from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PopupImageViewSet

router = DefaultRouter()
router.register('popup-images', PopupImageViewSet, basename='popup-image')

urlpatterns = [
    path('', include(router.urls)),
]
