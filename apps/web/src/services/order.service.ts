import { fetchWithAuth } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";
import { apiErrorMessage } from "./coupon.service";

/** A friend the buyer is booking alongside themselves. */
export interface GuestInput {
  full_name: string;
  email: string;
}

/** Somebody a booking covers. The buyer is always the first one. */
export interface OrderParticipant {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  is_buyer: boolean;
  /** Whether their fighter card is finished — what the emails nudge them about. */
  fighter_card_complete: boolean;
}

export interface CreateOrderPayload {
  package: number;
  start_date?: string; // "YYYY-MM-DD" — optional (nullable on the backend)
  /** Write-only. Omit entirely for a solo booking; never include the buyer. */
  guests?: GuestInput[];
}

/**
 * A rejected booking, keeping the guest-list messages separate.
 *
 * The API writes those three messages for the customer ("You are already on
 * this booking…"), and they belong against the guest section rather than the
 * page-level error line, so they travel apart from `message`.
 */
export class OrderApiError extends Error {
  guestErrors: string[];

  constructor(message: string, guestErrors: string[] = []) {
    super(message);
    this.name = "OrderApiError";
    this.guestErrors = guestErrors;
  }
}

/** `data.guests` is a list of strings, but tolerate a bare string too. */
function guestErrorsFrom(data: any): string[] {
  const raw = data?.data?.guests ?? data?.guests;
  if (Array.isArray(raw)) return raw.filter((m): m is string => typeof m === "string");
  return typeof raw === "string" ? [raw] : [];
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
  /** Everyone the booking covers — the buyer first. */
  participants: OrderParticipant[];
  participant_count: number;
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
    if (!res.ok) {
      throw new OrderApiError(
        apiErrorMessage(data, "Failed to create booking"),
        guestErrorsFrom(data)
      );
    }
    return data as Order;
  },

  /**
   * Replaces the whole guest list on a PENDING order — send the list you want,
   * not a diff, and `[]` shrinks the booking back to the buyer alone.
   *
   * The backend clears `razorpay_order_id` (that gateway order is locked to the
   * old amount), so a new payment order must be created afterwards. It also
   * drops a coupon that no longer qualifies and names it in `coupon_removed`.
   */
  async setParticipants(
    orderId: number,
    guests: GuestInput[]
  ): Promise<Order & { coupon_removed: string | null }> {
    const res = await fetchWithAuth(`${API_ENDPOINTS.ORDERS}/${orderId}/participants/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guests }),
    });
    let data: any;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) {
      throw new OrderApiError(
        apiErrorMessage(data, "Could not update who this booking covers."),
        guestErrorsFrom(data)
      );
    }
    return data as Order & { coupon_removed: string | null };
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
