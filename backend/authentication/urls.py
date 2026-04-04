from django.urls import path
from .views import GoogleLoginView, CookieTokenRefreshView, LogoutView

urlpatterns = [
    path('google/', GoogleLoginView.as_view(), name='google_login'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
