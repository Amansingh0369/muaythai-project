import type { CSSProperties } from "react";
import type { EnrichedPackage } from "@/components/FightCampsSection/FightCampsSection.helpers";
import type { FullUser, UpdateProfilePayload, UserProfile } from "@/services/user.service";
import type { GuestInput } from "@/services/order.service";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Camp details are public; the form step is signed-in only. */
export type Step = "details" | "form";

/** Everything the booking needs from the user. Passed around as one object so a
 *  submit that resumes after login never reads half-updated React state. */
export interface BookingValues {
  fullName: string;
  phone: string;
  age: string;
  gender: string;
  emergencyName: string;
  emergencyPhone: string;
  passport: string;
  medical: string;
  allergies: string;
  /** Friends on the same booking. Empty for a solo booking — the buyer is never in here. */
  guests: GuestInput[];
}

/** A coupon the customer has validated against the package, before any order exists. */
export interface AppliedCoupon {
  code: string;
  subtotal_amount: string;
  discount_amount: string;
  total_amount: string;
  /** True when the discount was trimmed to keep the total at the ₹1 floor. */
  isCapped: boolean;
}

/** Every value except `guests`, which is an array and is handled on its own. */
export type BookingField = Exclude<keyof BookingValues, "guests">;
export type FormErrors = Partial<Record<BookingField, string>>;

/**
 * The text fields, listed rather than derived, because several loops here and
 * in `useBookingDraft` call `.trim()` on every value — which an array is not.
 */
export const TEXT_FIELDS: BookingField[] = [
  "fullName",
  "phone",
  "age",
  "gender",
  "emergencyName",
  "emergencyPhone",
  "passport",
  "medical",
  "allergies",
];

export const EMPTY_VALUES: BookingValues = {
  fullName: "",
  phone: "",
  age: "",
  gender: "",
  emergencyName: "",
  emergencyPhone: "",
  passport: "",
  medical: "",
  allergies: "",
  guests: [],
};

/** `orders.models.MAX_ORDER_PARTICIPANTS` — the buyer counts towards it. */
export const MAX_PARTICIPANTS = 10;
export const MAX_GUESTS = MAX_PARTICIPANTS - 1;

// ── Formatting ────────────────────────────────────────────────────────────────

export function fmtPrice(price: string | number): string {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

/** Discounts read as a subtraction in the summary — "−₹9,000". */
export function fmtDiscount(amount: string | number): string {
  return `−${fmtPrice(amount)}`;
}

/** The backend sends "0.00" when nothing was taken off, and the summary stays single-line. */
export function hasDiscount(coupon: AppliedCoupon | null): coupon is AppliedCoupon {
  return !!coupon && Number(coupon.discount_amount) > 0;
}

/** Razorpay refuses anything under ₹1. */
export const MIN_PAYABLE_AMOUNT = 1;

const toPaise = (amount: string | number): number => Math.round(Number(amount) * 100);
const toAmount = (paise: number): string => (paise / 100).toFixed(2);

/**
 * Mirrors `Order.recalculate_totals`, which trims a discount so the total never falls below
 * the ₹1 floor. `/coupons/preview/` skips that trim, so a coupon worth the full package price
 * previews as ₹0 and then bills ₹1 once applied to a real order. Re-deriving the cap here keeps
 * the summary honest about what will actually be charged — the order endpoints stay
 * authoritative, this only stops the pre-order estimate from contradicting them.
 * Integer paise throughout, so no float drift creeps into a displayed amount.
 */
export function capPreviewToMinimum(
  preview: { subtotal_amount: string; discount_amount: string },
  code: string
): AppliedCoupon {
  const subtotal = toPaise(preview.subtotal_amount);
  const requested = toPaise(preview.discount_amount);
  const headroom = Math.max(subtotal - MIN_PAYABLE_AMOUNT * 100, 0);
  const discount = Math.min(requested, headroom);

  return {
    code,
    subtotal_amount: toAmount(subtotal),
    discount_amount: toAmount(discount),
    total_amount: toAmount(subtotal - discount),
    isCapped: discount < requested,
  };
}

export function fmtDate(date: string | null): string | null {
  return date
    ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;
}

/** Page gutter shared by every band on the booking page. */
export const SHELL = "max-w-7xl mx-auto px-5 md:px-10 lg:px-16";

/** Heading style for the content boxes on the details step. */
export const BOX_HEADING = "font-barlow font-black italic text-xl sm:text-2xl uppercase tracking-wide text-white";

/** Grain overlay shared by the camp hero and the summary card. */
export const NOISE_OVERLAY: CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
  backgroundSize: "128px",
};

// ── Package content ───────────────────────────────────────────────────────────

export interface ContentSection {
  label: string;
  items: string[];
}

/** The camp's written content, in reading order, with empty sections dropped. */
export function contentSections(pkg: EnrichedPackage): ContentSection[] {
  return [
    { label: "Ideal For", items: pkg.ideal_for },
    { label: "Training", items: pkg.training },
    { label: "Experience", items: pkg.experience },
    { label: "Accommodation", items: pkg.accommodation },
    { label: "What's Included", items: pkg.included },
  ].filter((s) => Array.isArray(s.items) && s.items.length > 0);
}

/** The backend sends each section as one long string with "*" between the points,
 *  so split it out and let every point have its own line. */
export function splitPoints(items: string[]): string[] {
  return items
    .flatMap((item) => item.split("*"))
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Sections written as a paragraph carry no "*" — those render as prose, not a list. */
export function isProse(items: string[]): boolean {
  return !items.some((item) => item.includes("*"));
}

// ── Profile ↔ form ────────────────────────────────────────────────────────────

function profileValues(profile: FullUser): BookingValues {
  const p = profile.profile;
  return {
    // Guests are never part of a saved profile; only the text fields fill blanks.
    guests: [],
    fullName: profile.full_name ?? "",
    phone: p?.phone_no ?? "",
    age: p?.age != null ? String(p.age) : "",
    gender: p?.gender ?? "",
    emergencyName: p?.emergency_contact_name ?? "",
    emergencyPhone: p?.emergency_contact_phone ?? "",
    passport: p?.passport_number ?? "",
    medical: p?.medical_conditions ?? "",
    allergies: p?.allergies ?? "",
  };
}

/** Fill only what the user hasn't typed — the saved profile never clobbers live input. */
export function fillBlanks(current: BookingValues, profile: FullUser): BookingValues {
  const saved = profileValues(profile);
  const merged = { ...current };
  TEXT_FIELDS.forEach((key) => {
    if (!merged[key].trim()) merged[key] = saved[key];
  });
  return merged;
}

export function profileUpdatePayload(v: BookingValues): UpdateProfilePayload {
  return {
    full_name: v.fullName || undefined,
    profile: {
      phone_no: v.phone || null,
      age: v.age ? Number(v.age) : null,
      gender: (v.gender as UserProfile["gender"]) || null,
      emergency_contact_name: v.emergencyName || null,
      emergency_contact_phone: v.emergencyPhone || null,
      passport_number: v.passport || null,
      medical_conditions: v.medical || null,
      allergies: v.allergies || null,
    },
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

/** One source of truth for what blocks a booking — drives both the inline field
 *  errors and the "still needed" banner, so the two can never disagree. */
const REQUIRED_FIELDS: { field: BookingField; label: string; error: string }[] = [
  { field: "fullName", label: "Full Name", error: "Full name is required" },
  { field: "phone", label: "Phone", error: "Phone number is required" },
  { field: "emergencyName", label: "Emergency Contact", error: "Emergency contact name is required" },
  { field: "emergencyPhone", label: "Emergency Phone", error: "Emergency contact phone is required" },
  { field: "passport", label: "Passport", error: "Passport number is required for international travel" },
];

export function validateValues(v: BookingValues): FormErrors {
  const errors: FormErrors = {};
  REQUIRED_FIELDS.forEach(({ field, error }) => {
    if (!v[field].trim()) errors[field] = error;
  });
  return errors;
}

// ── Guests ────────────────────────────────────────────────────────────────────

export interface GuestFieldErrors {
  full_name?: string;
  email?: string;
}

/** Keyed by row index so each message renders against the input it belongs to. */
export type GuestErrors = Record<number, GuestFieldErrors>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The same rules the API enforces, run before submit.
 *
 * The backend returns these under `data.guests` and its wording is already
 * customer-ready, so the two messages that can also come back from the server
 * are worded identically here — a customer should never see the same problem
 * described two different ways.
 */
export function validateGuests(guests: GuestInput[], buyerEmail: string): GuestErrors {
  const errors: GuestErrors = {};
  const seen = new Map<string, number>();
  const buyer = buyerEmail.trim().toLowerCase();

  guests.forEach((guest, i) => {
    const row: GuestFieldErrors = {};
    const name = guest.full_name.trim();
    const email = guest.email.trim();
    const key = email.toLowerCase();

    if (!name) row.full_name = "Their name is required";

    if (!email) {
      row.email = "Their email is required";
    } else if (!EMAIL_RE.test(email)) {
      row.email = "That does not look like an email address";
    } else if (buyer && key === buyer) {
      row.email = "You are already on this booking — you do not need to add yourself as a guest.";
    } else if (seen.has(key)) {
      row.email = `${email} appears on this booking more than once.`;
    }

    if (!row.email && email) seen.set(key, i);
    if (row.full_name || row.email) errors[i] = row;
  });

  return errors;
}

export function hasGuestErrors(errors: GuestErrors): boolean {
  return Object.keys(errors).length > 0;
}

// ── Group pricing ─────────────────────────────────────────────────────────────

/** The booking covers the buyer plus their guests. */
export function participantCount(v: BookingValues): number {
  return v.guests.length + 1;
}

/** Package price once per person, in integer paise so no float drift creeps in. */
export function groupSubtotal(price: string | number, count: number): string {
  return toAmount(toPaise(price) * count);
}

/**
 * What the summary should show before payment.
 *
 * A coupon on a group booking is the awkward case: `/coupons/preview/` prices
 * one place and does not expose the coupon's `max_discount_amount`, so the real
 * group discount cannot be derived here — scaling the preview would overstate
 * it whenever a cap exists, and showing less than Razorpay charges is the one
 * direction that must never happen. So the discount is shown as pending rather
 * than guessed; the order endpoints stay authoritative, as they already are.
 */
export interface PriceView {
  count: number;
  perPerson: string;
  subtotal: string;
  /** Null when there is no coupon, or when the exact figure is only known at payment. */
  discount: string | null;
  total: string;
  /** True when a coupon is applied to a group booking: total shown is pre-discount. */
  discountPending: boolean;
  couponCode: string | null;
}

export function priceView(
  price: string | number,
  coupon: AppliedCoupon | null,
  count: number
): PriceView {
  const subtotal = groupSubtotal(price, count);
  const base = {
    count,
    perPerson: String(price),
    subtotal,
    couponCode: coupon?.code ?? null,
  };

  if (!hasDiscount(coupon)) {
    return { ...base, discount: null, total: subtotal, discountPending: false };
  }

  // Solo booking: the preview priced exactly this, so show it as before.
  if (count === 1) {
    return {
      ...base,
      subtotal: coupon.subtotal_amount,
      discount: coupon.discount_amount,
      total: coupon.total_amount,
      discountPending: false,
    };
  }

  return { ...base, discount: null, total: subtotal, discountPending: true };
}

export function missingFieldLabels(v: BookingValues): string[] {
  return REQUIRED_FIELDS.filter(({ field }) => !v[field].trim()).map(({ label }) => label);
}

/** Per-section completion ticks on the form headers. */
export function sectionCompletion(v: BookingValues) {
  return {
    personal: !!(v.fullName.trim() && v.phone.trim() && v.age && v.gender),
    emergency: !!(v.emergencyName.trim() && v.emergencyPhone.trim()),
    travel: !!v.passport.trim(),
  };
}
