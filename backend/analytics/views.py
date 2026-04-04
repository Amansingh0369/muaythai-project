from rest_framework import views, response, status
from core.permissions import IsAdmin
from .services import AnalyticsService

class AnalyticsDashboardView(views.APIView):
    """
    Analytics View: Overall Dashboard stats (Revenue, Users, Visits, Likes)
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        return response.Response(AnalyticsService.get_overall_stats())

class RevenueAnalyticsView(views.APIView):
    """
    Analytics View: Revenue Trends
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        return response.Response(AnalyticsService.get_revenue_stats())

class UserAnalyticsView(views.APIView):
    """
    Analytics View: User Stats
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        return response.Response(AnalyticsService.get_user_stats())

class OrderAnalyticsView(views.APIView):
    """
    Analytics View: Order Trends
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        return response.Response(AnalyticsService.get_order_stats())

class LocationAnalyticsView(views.APIView):
    """
    Analytics View: Location Performance
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        return response.Response(AnalyticsService.get_location_performance())

class VisitorAnalyticsView(views.APIView):
    """
    Analytics View: Detailed Traffic Stats
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        return response.Response(AnalyticsService.get_visitor_stats())
