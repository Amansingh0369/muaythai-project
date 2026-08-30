from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    FighterCardAdminViewSet,
    FighterCardOptionsView,
    MyFighterCardPhotoView,
    MyFighterCardView,
)

router = DefaultRouter()
router.register('', FighterCardAdminViewSet, basename='fighter-card-admin')

urlpatterns = [
    # Declared before the router so they are not swallowed by its detail route.
    path('me/', MyFighterCardView.as_view(), name='fighter-card-me'),
    path('me/photo/', MyFighterCardPhotoView.as_view(), name='fighter-card-me-photo'),
    path('options/', FighterCardOptionsView.as_view(), name='fighter-card-options'),
    path('', include(router.urls)),
]
