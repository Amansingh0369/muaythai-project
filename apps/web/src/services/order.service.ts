import { fetchWithAuth } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

export interface CreateOrderPayload {
  package: number;
  start_date?: string; // "YYYY-MM-DD" — optional (nullable on the backend)
}

export interface Order {
  id: number; // backend returns a numeric id
  package: number;
  package_name: string; // added on the backend serializer
  total_amount: string;
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

  async listMine(): Promise<Order[]> {
    const res = await fetchWithAuth(API_ENDPOINTS.ORDERS + "/my/", { method: "GET" });
    let data: any;
    try { data = await res.json(); } catch { data = []; }
    if (!res.ok) throw new Error(data.detail || data.error || "Failed to load orders");
    return data as Order[];
  },
};
