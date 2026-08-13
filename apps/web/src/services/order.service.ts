import { fetchWithAuth } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";
import { apiErrorMessage } from "./coupon.service";

export interface CreateOrderPayload {
  package: number;
  start_date?: string; // "YYYY-MM-DD" — optional (nullable on the backend)
}

export interface Order {
  id: number; // backend returns a numeric id
  package: number;
  package_name: string; // added on the backend serializer
  // Pricing is owned by the backend — these are read-only, never posted.
  subtotal_amount: string; // package price at the time the order was created
  discount_amount: string; // "0.00" when no coupon is applied
  total_amount: string; // what the customer actually pays
  coupon: number | null;
  coupon_code: string | null;
  // backend uses PAID, not CONFIRMED:
  status: "PENDING" | "PAID" | "CANCELLED" | "COMPLETED";
  razorpay_order_id: string | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;
}

export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const res = await fetchWithAuth(API_ENDPOINTS.ORDERS + "/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data: any;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) throw new Error(data.detail || data.error || data.message || "Failed to create booking");
    return data as Order;
  },

  /** Re-prices a PENDING order. This clears the order's razorpay_order_id on the backend,
   *  so the Razorpay order must be created again afterwards. */
  async applyCoupon(orderId: number, code: string): Promise<Order> {
    const res = await fetchWithAuth(`${API_ENDPOINTS.ORDERS}/${orderId}/apply-coupon/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    let data: any;
    try { data = await res.json(); } catch { data = {}; }
    // The backend's `error` copy is written for end users — surface it verbatim.
    if (!res.ok) throw new Error(apiErrorMessage(data, "Could not apply that coupon."));
    return data as Order;
  },

  async removeCoupon(orderId: number): Promise<Order> {
    const res = await fetchWithAuth(`${API_ENDPOINTS.ORDERS}/${orderId}/remove-coupon/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    let data: any;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) throw new Error(apiErrorMessage(data, "Could not remove that coupon."));
    return data as Order;
  },

  async listMine(): Promise<Order[]> {
    const res = await fetchWithAuth(API_ENDPOINTS.ORDERS + "/my/", { method: "GET" });
    let data: any;
    try { data = await res.json(); } catch { data = []; }
    if (!res.ok) throw new Error(data.detail || data.error || "Failed to load orders");
    return data as Order[];
  },
};
