from django.db import models
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from users.models import User
from orders.models import Order, OrderStatus
from payments.models import Payment, PaymentStatus
from locations.models import Location
from packages.models import Package

from analytics.models import Visit
from packages.models import Package, PackageLike

class AnalyticsService:
    @staticmethod
    def get_overall_stats():
        """
        Get high-level platform summary (including behavioral metrics)
        """
        today = timezone.now().date()
        return {
            'total_users': User.objects.count(),
            'total_revenue': Payment.objects.filter(status=PaymentStatus.SUCCESS).aggregate(Sum('amount'))['amount__sum'] or 0,
            'total_orders': Order.objects.count(),
            'total_active_packages': Package.objects.filter(is_active=True).count(),
            'visits_today': Visit.objects.filter(timestamp__date=today).count(),
            'total_likes': PackageLike.objects.count(),
        }

    @staticmethod
    def get_revenue_stats():
        """
        Get revenue breakdown (daily for last 30 days)
        """
        last_30_days = timezone.now() - timedelta(days=30)
        return list(
            Payment.objects.filter(status=PaymentStatus.SUCCESS, created_at__gte=last_30_days)
            .values('created_at__date')
            .annotate(daily_revenue=Sum('amount'))
            .order_by('created_at__date')
        )

    @staticmethod
    def get_user_stats():
        """
        Get user growth stats
        """
        return {
            'by_role': list(User.objects.values('role').annotate(count=Count('id'))),
            'new_users_30d': User.objects.filter(created_at__gte=timezone.now() - timedelta(days=30)).count()
        }

    @staticmethod
    def get_order_stats():
        """
        Get order trends by status
        """
        return list(Order.objects.values('status').annotate(count=Count('id')))

    @staticmethod
    def get_location_performance():
        """
        Get revenue and orders per location
        """
        return list(
            Location.objects.annotate(
                order_count=Count('packages__orders'),
                total_revenue=Sum('packages__orders__payments__amount', filter=Q(packages__orders__payments__status=PaymentStatus.SUCCESS))
            ).values('name', 'order_count', 'total_revenue')
        )

    @staticmethod
    def get_visitor_stats():
        """
        Get detailed traffic analytics
        """
        last_7_days = timezone.now() - timedelta(days=7)
        return {
            'daily_visits': list(
                Visit.objects.filter(timestamp__gte=last_7_days)
                .values('timestamp__date')
                .annotate(count=Count('id'))
                .order_by('timestamp__date')
            ),
            'top_paths': list(
                Visit.objects.values('path')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            ),
            'total_unique_ips': Visit.objects.values('ip_address').distinct().count()
        }
