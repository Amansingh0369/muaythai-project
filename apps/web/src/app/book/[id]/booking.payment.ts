import { paymentService, CreateRazorpayOrderResponse } from "@/services/payment.service";
import type { Order } from "@/services/order.service";
import type { BookingValues } from "./booking.helpers";

/**
 * Opens Razorpay Checkout and resolves only once the backend has verified the
 * signature — a resolved promise means the booking is genuinely paid for.
 */
export function openRazorpayCheckout({
  order,
  rzp,
  values,
  email,
  description,
}: {
  order: Order;
  rzp: CreateRazorpayOrderResponse;
  values: BookingValues;
  email?: string;
  description: string;
}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const options: RazorpayOptions = {
      key: rzp.razorpay_key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      amount: rzp.amount, // paise, from the backend
      currency: rzp.currency, // "INR"
      name: "This Is Muay Thai",
      description,
      order_id: rzp.razorpay_order_id,
      prefill: {
        name: values.fullName,
        email,
        contact: values.phone,
      },
      notes: { django_order_id: String(order.id) },
      theme: { color: "#ff5a1f" },
      handler: async (resp) => {
        try {
          await paymentService.verifyPayment({
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_signature: resp.razorpay_signature,
          });
          resolve(); // verified on the backend → safe to show success
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () =>
          reject(new Error("Payment cancelled. Your spot is not booked yet — you can retry anytime.")),
      },
    };

    const instance = new window.Razorpay(options);
    instance.on("payment.failed", (resp: any) => {
      reject(new Error(resp?.error?.description || "Payment failed. Please try again."));
    });
    instance.open();
  });
}
