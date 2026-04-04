from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileView, UserAdminViewSet

router = DefaultRouter()
router.register('', UserAdminViewSet, basename='user-admin')

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('', include(router.urls)),
]
