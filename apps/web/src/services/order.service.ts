import { fetchWithAuth } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

export interface CreateOrderPayload {
  package: number;
  start_date: string;
}

export interface Order {
  id: string;
  package_name: string;
  total_amount: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  start_date: string;
  created_at: string;
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
};
