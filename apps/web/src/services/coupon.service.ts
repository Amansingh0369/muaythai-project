import { fetchWithAuth } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

export interface PreviewedCoupon {
  code: string;
  description: string;
  discount_type: string; // "PERCENTAGE" | fixed-amount variants
  value: string;
}

// Response from POST /api/coupons/preview/ — amounts are strings with 2 decimals.
export interface CouponPreview {
  valid: boolean;
  coupon: PreviewedCoupon;
  subtotal_amount: string;
  discount_amount: string;
  total_amount: string;
}

/** Some error envelopes send `error` as the boolean `true`, which would otherwise end up
 *  as the message — only a non-empty string is something we can show a customer. */
export function apiErrorMessage(data: any, fallback: string): string {
  for (const candidate of [data?.detail, data?.error, data?.message]) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return fallback;
}

export const couponService = {
  /** Prices a code against a package before any order exists — creates nothing, so it is
   *  safe to call while the customer is still filling in the form. */
  async preview(code: string, packageId: number): Promise<CouponPreview> {
    const res = await fetchWithAuth(API_ENDPOINTS.COUPONS + "/preview/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, package_id: packageId }),
    });
    let data: any;
    try { data = await res.json(); } catch { data = {}; }
    // The backend's `error` copy is written for end users — surface it verbatim.
    if (!res.ok) throw new Error(apiErrorMessage(data, "Could not check that coupon."));
    return data as CouponPreview;
  },
};
