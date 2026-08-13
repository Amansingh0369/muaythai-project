from decimal import Decimal

# Razorpay rejects any order below ₹1.00, so no amount we ever ask a customer to
# pay may fall under it. This lives in `core` rather than `payments` because
# pricing is where the rule has to be enforced — `orders` caps a coupon's
# discount so the total never lands below it — and `orders` importing `payments`
# would invert the existing dependency (payments already imports orders).
MIN_PAYABLE_AMOUNT = Decimal('1.00')
MIN_PAYABLE_PAISE = 100
