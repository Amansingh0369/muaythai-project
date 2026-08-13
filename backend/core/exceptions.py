from django.db.models import ProtectedError, RestrictedError
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def _protected_delete_response(exc):
    """Turn a PROTECT/RESTRICT foreign-key violation into a 409, not a 500.

    Several relations deliberately protect rows that history depends on —
    `Order.coupon` and `Order.package` both do, so that a paid booking always
    keeps the coupon and package it was made against. Django signals this with
    ProtectedError, which DRF does not recognise, so without this the caller
    gets an unhandled 500 instead of something actionable.
    """
    blocking = getattr(exc, 'protected_objects', None) or getattr(exc, 'restricted_objects', ())
    names = sorted({str(obj._meta.verbose_name_plural) for obj in blocking})
    referenced_by = ', '.join(names) if names else 'other records'
    message = (
        f'This cannot be deleted because it is still referenced by existing '
        f'{referenced_by}. Deactivate it instead so the existing records keep '
        f'their history.'
    )
    return Response(
        {'error': True, 'message': message, 'data': {'detail': message}},
        status=status.HTTP_409_CONFLICT,
    )


def custom_exception_handler(exc, context):
    if isinstance(exc, (ProtectedError, RestrictedError)):
        return _protected_delete_response(exc)

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
