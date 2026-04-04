import razorpay
import hmac
import hashlib
from django.conf import settings
from rest_framework import exceptions

class RazorpayService:
    def __init__(self):
        self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    def create_order(self, amount: float, currency: str = 'INR'):
        """
        Create a Razorpay order
        Amount should be in the smallest unit (paise for INR)
        """
        data = {
            'amount': int(amount * 100),
            'currency': currency,
            'payment_capture': 1 # Auto-capture
        }
        try:
            order = self.client.order.create(data=data)
            return order
        except Exception as e:
            raise exceptions.APIException(f"Razorpay Order Creation Failed: {str(e)}")

    def verify_payment_signature(self, razorpay_order_id, razorpay_payment_id, razorpay_signature):
        """
        Verify the payment signature sent by Razorpay
        """
        try:
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }
            return self.client.utility.verify_payment_signature(params_dict)
        except Exception:
            return False
