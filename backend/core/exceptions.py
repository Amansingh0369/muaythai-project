from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    # If an unexpected error occurs (one not handled by DRF), it will be None.
    if response is not None:
        custom_data = {
            'error': True,
            'message': response.data.get('detail', str(exc)),
            'data': response.data
        }
        response.data = custom_data

    return response
