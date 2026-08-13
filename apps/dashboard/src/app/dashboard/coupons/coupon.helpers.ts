import { Coupon, CouponFormData } from "@/services/coupon.service";

export type CouponStatus =
  | "INACTIVE"
  | "EXHAUSTED"
  | "EXPIRED"
  | "SCHEDULED"
  | "ACTIVE";

export const COUPON_STATUSES: CouponStatus[] = [
  "ACTIVE",
  "SCHEDULED",
  "EXPIRED",
  "EXHAUSTED",
  "INACTIVE",
];

/**
 * The five fields the server freezes once an order references the coupon.
 * Used only as a fallback — `coupon.locked_fields` is the source of truth.
 */
export const LOCKABLE_FIELDS = [
  "code",
  "discount_type",
  "value",
  "max_discount_amount",
  "min_order_amount",
] as const;

export type LockableField = (typeof LOCKABLE_FIELDS)[number];

/**
 * Locking is driven by `is_used` / `locked_fields`, never by `times_redeemed`:
 * a coupon sitting on an unpaid PENDING order still reads 0 redemptions but is locked.
 */
export function isFieldLocked(coupon: Coupon | null, field: LockableField): boolean {
  if (!coupon) return false; // create → nothing is locked yet
  if (Array.isArray(coupon.locked_fields)) return coupon.locked_fields.includes(field);
  // Older payloads may predate locked_fields; fall back to the known set.
  return coupon.is_used === true;
}

export function hasLockedFields(coupon: Coupon | null): boolean {
  return LOCKABLE_FIELDS.some((field) => isFieldLocked(coupon, field));
}

function parseAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const raw = typeof value === "string" ? value.trim() : value;
  if (raw === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

export function formatINR(value: string | number | null | undefined): string {
  const num = parseAmount(value);
  if (num === null) return "—";
  return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/** Percentages keep their decimals off too — "20%" reads better than "20.00%". */
function formatPercent(value: string | number | null | undefined): string {
  const num = parseAmount(value);
  if (num === null) return "—";
  return `${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
}

export function formatDiscount(coupon: Coupon): string {
  return coupon.discount_type === "PERCENTAGE"
    ? formatPercent(coupon.value)
    : `${formatINR(coupon.value)} off`;
}

export function formatUsage(coupon: Coupon): string {
  return `${coupon.times_redeemed} / ${coupon.max_redemptions ?? "∞"}`;
}

export function deriveStatus(coupon: Coupon): CouponStatus {
  if (!coupon.is_active) return "INACTIVE";
  if (coupon.is_exhausted) return "EXHAUSTED";
  const now = Date.now();
  const until = toTime(coupon.valid_until);
  if (until !== null && until < now) return "EXPIRED";
  const from = toTime(coupon.valid_from);
  if (from !== null && from > now) return "SCHEDULED";
  return "ACTIVE";
}

function toTime(iso: string | null): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : time;
}

// Fixed abbreviations: en-GB/en-IN render September as "Sept", which is wider
// than every other month and jitters the column.
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDay(iso: string, withYear: boolean): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const base = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return withYear ? `${base} ${date.getFullYear()}` : base;
}

function yearOf(iso: string): number | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear();
}

export function formatValidity(coupon: Coupon): string {
  const { valid_from, valid_until } = coupon;
  if (!valid_from && !valid_until) return "—";
  if (valid_from && !valid_until) return `From ${formatDay(valid_from, true)}`;
  if (!valid_from && valid_until) return `Until ${formatDay(valid_until, true)}`;
  if (valid_from && valid_until) {
    // Drop the year off the start when both ends land in the same year.
    const sameYear = yearOf(valid_from) === yearOf(valid_until);
    return `${formatDay(valid_from, !sameYear)} – ${formatDay(valid_until, true)}`;
  }
  return "—";
}

/** Plain-language echo of what the form currently describes. Blank clauses drop out. */
export function buildPreviewLine(form: CouponFormData): string {
  const value = form.value.trim();
  if (!value) return "";

  const clauses: string[] = [];

  if (form.discount_type === "PERCENTAGE") {
    clauses.push(`${formatPercent(value)} off`);
    const cap = form.max_discount_amount.trim();
    if (cap) clauses.push(`up to ${formatINR(cap)}`);
  } else {
    clauses.push(`${formatINR(value)} off`);
  }

  const floor = form.min_order_amount.trim();
  if (floor) clauses.push(`on orders over ${formatINR(floor)}`);

  return clauses.join(", ");
}

/**
 * The API speaks absolute ISO timestamps while <input type="datetime-local">
 * speaks naive local wall-clock, so both directions convert explicitly rather
 * than slicing the string and leaving the server to guess a timezone.
 */
export function toDateTimeLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function fromDateTimeLocalInput(local: string): string | null {
  const trimmed = local.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
