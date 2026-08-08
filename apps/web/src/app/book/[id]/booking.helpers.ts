import type { CSSProperties } from "react";
import type { EnrichedPackage } from "@/components/FightCampsSection/FightCampsSection.helpers";
import type { FullUser, UpdateProfilePayload, UserProfile } from "@/services/user.service";

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
}

export type BookingField = keyof BookingValues;
export type FormErrors = Partial<Record<BookingField, string>>;

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
};

// ── Formatting ────────────────────────────────────────────────────────────────

export function fmtPrice(price: string | number): string {
  return `₹${Number(price).toLocaleString("en-IN")}`;
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
  (Object.keys(merged) as BookingField[]).forEach((key) => {
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
