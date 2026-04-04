from .models import Visit

class VisitLoggerMiddleware:
    """
    Middleware to log every API visit to the database
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only log requests to the API
        if request.path.startswith('/api/'):
            # Get data
            ip = request.META.get('REMOTE_ADDR')
            ua = request.META.get('HTTP_USER_AGENT')
            user = request.user if request.user.is_authenticated else None
            
            # Log it (simple creation, doesn't wait for response)
            Visit.objects.create(
                user=user,
                ip_address=ip,
                user_agent=ua,
                path=request.path
            )

        response = self.get_response(request)
        return response
