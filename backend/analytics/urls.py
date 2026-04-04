from django.urls import path
from .views import (
    AnalyticsDashboardView,
    RevenueAnalyticsView,
    UserAnalyticsView,
    OrderAnalyticsView,
    LocationAnalyticsView,
    VisitorAnalyticsView
)

urlpatterns = [
    path('', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    path('revenue/', RevenueAnalyticsView.as_view(), name='analytics-revenue'),
    path('users/', UserAnalyticsView.as_view(), name='analytics-users'),
    path('orders/', OrderAnalyticsView.as_view(), name='analytics-orders'),
    path('locations/', LocationAnalyticsView.as_view(), name='analytics-locations'),
    path('visitors/', VisitorAnalyticsView.as_view(), name='analytics-visitors'),
]
