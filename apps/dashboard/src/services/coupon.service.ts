import { API_ENDPOINTS } from "@/lib/api-constants";
import { fetchWithAuth } from "@/lib/api";

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: DiscountType;
  /** Percent when PERCENTAGE, rupees when FIXED. Decimal string — never do float math on it. */
  value: string;
  /** Ceiling on a percentage discount. Only meaningful for PERCENTAGE coupons. */
  max_discount_amount: string | null;
  min_order_amount: string | null;
  valid_from: string | null;
  valid_until: string | null;
  /** null = unlimited */
  max_redemptions: number | null;
  /** Read-only. Counts PAID redemptions only — this is NOT a lock signal. */
  times_redeemed: number;
  /** Read-only, derived server-side. */
  is_exhausted: boolean;
  /** Read-only. True as soon as ANY order references the coupon, paid or not. */
  is_used: boolean;
  /** Read-only. The fields the server will now reject changes to. */
  locked_fields: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Write payload. `max_discount_amount` is omitted entirely for FIXED coupons. */
export interface CreateCouponInput {
  code: string;
  description: string;
  discount_type: DiscountType;
  value: string;
  max_discount_amount?: string | null;
  min_order_amount: string | null;
  valid_from: string | null;
  valid_until: string | null;
  max_redemptions: number | null;
  is_active: boolean;
}

/**
 * Form-shaped state. Every input is held as a string so half-typed values
 * round-trip without being coerced; the hook converts to CreateCouponInput on submit.
 */
export interface CouponFormData {
  code: string;
  description: string;
  discount_type: DiscountType;
  value: string;
  max_discount_amount: string;
  min_order_amount: string;
  valid_from: string;
  valid_until: string;
  max_redemptions: string;
  is_active: boolean;
}

export type CouponFieldErrors = Record<string, string[]>;

/**
 * Carries DRF field-level validation errors so the form can render them inline.
 * `isConflict` marks the 409 returned when a coupon is still referenced by orders —
 * that is an expected outcome the UI offers deactivation for, not a failure.
 */
export class CouponApiError extends Error {
  fieldErrors: CouponFieldErrors;
  isConflict: boolean;
  constructor(message: string, fieldErrors: CouponFieldErrors, isConflict = false) {
    super(message);
    this.name = "CouponApiError";
    this.fieldErrors = fieldErrors;
    this.isConflict = isConflict;
  }
}

/** Envelope keys the API wraps errors in — they are not form fields. */
const ENVELOPE_KEYS = new Set(["detail", "message", "error", "data"]);

function normalizeFieldErrors(errorData: unknown): CouponFieldErrors {
  const out: CouponFieldErrors = {};
  if (errorData && typeof errorData === "object") {
    for (const [key, value] of Object.entries(errorData as Record<string, unknown>)) {
      if (ENVELOPE_KEYS.has(key)) continue;
      out[key] = Array.isArray(value) ? value.map(String) : [String(value)];
    }
  }
  return out;
}

function buildErrorMessage(
  errorData: any,
  fieldErrors: CouponFieldErrors,
  fallback: string
): string {
  const flat = Object.entries(fieldErrors)
    .map(([k, v]) => `${k}: ${v.join(", ")}`)
    .join(" | ");
  // `error` arrives as the boolean flag `true` on envelope-style responses,
  // so only string candidates count as a usable message.
  const top = [errorData?.detail, errorData?.error, errorData?.message].find(
    (c) => typeof c === "string" && c.trim()
  );
  return top || flat || fallback;
}

export const couponService = {
  async getCoupons(): Promise<Coupon[]> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.COUPONS}/`);
    if (!response.ok) {
      throw new Error("Failed to fetch coupons");
    }
    return response.json();
  },

  async createCoupon(data: CreateCouponInput): Promise<Coupon> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.COUPONS}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const fieldErrors = normalizeFieldErrors(errorData);
      throw new CouponApiError(
        buildErrorMessage(errorData, fieldErrors, "Failed to create coupon"),
        fieldErrors
      );
    }

    return response.json();
  },

  async updateCoupon(id: number, data: Partial<CreateCouponInput>): Promise<Coupon> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.COUPONS}/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const fieldErrors = normalizeFieldErrors(errorData);
      throw new CouponApiError(
        buildErrorMessage(errorData, fieldErrors, "Failed to update coupon"),
        fieldErrors
      );
    }

    return response.json();
  },

  async deleteCoupon(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.COUPONS}/${id}/`, {
      method: "DELETE",
    });

    if (response.ok) return;

    const errorData = await response.json().catch(() => ({}));
    const fieldErrors = normalizeFieldErrors(errorData);

    // 409 means orders still reference this coupon. The server's message explains
    // the deactivate-instead path, so surface it verbatim rather than a generic error.
    if (response.status === 409) {
      throw new CouponApiError(
        typeof errorData?.message === "string" && errorData.message.trim()
          ? errorData.message
          : "This coupon is still referenced by existing orders. Deactivate it instead.",
        fieldErrors,
        true
      );
    }

    throw new CouponApiError(
      buildErrorMessage(errorData, fieldErrors, "Failed to delete coupon"),
      fieldErrors
    );
  },
};
