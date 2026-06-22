import { fetchWithAuth } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

// Response from POST /api/payments/create-order/
export interface CreateRazorpayOrderResponse {
  razorpay_key_id: string;
  razorpay_order_id: string;
  amount: number; // in paise
  currency: string; // "INR"
  order_id: number; // the Django order id
}

// What Razorpay's checkout handler returns
export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  message: string;
  order_id: number;
}

async function parse(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export const paymentService = {
  // Step 2 — ask the backend to create/reuse a Razorpay order for a Django order
  async createRazorpayOrder(orderId: number): Promise<CreateRazorpayOrderResponse> {
    const res = await fetchWithAuth(API_ENDPOINTS.PAYMENTS.CREATE_ORDER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });
    const data = await parse(res);
    if (!res.ok) {
      throw new Error(data.error || data.detail || "Failed to start payment");
    }
    return data as CreateRazorpayOrderResponse;
  },

  // Step 4 — verify the signature on the backend
  async verifyPayment(payload: RazorpayHandlerResponse): Promise<VerifyPaymentResponse> {
    const res = await fetchWithAuth(API_ENDPOINTS.PAYMENTS.VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parse(res);
    if (!res.ok) {
      throw new Error(data.error || data.detail || "Payment verification failed");
    }
    return data as VerifyPaymentResponse;
  },

  // Optional — payment history for the logged-in user
  async getHistory(): Promise<any[]> {
    const res = await fetchWithAuth(API_ENDPOINTS.PAYMENTS.HISTORY, { method: "GET" });
    const data = await parse(res);
    if (!res.ok) throw new Error(data.error || data.detail || "Failed to load history");
    return data as any[];
  },
};
