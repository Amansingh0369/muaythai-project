import type { Package } from "@/services/package.service";

/**
 * Sentinel for "no preference" — shared by the selects and the URL query params
 * (`/camps?month=any&duration=any&city=Phuket`).
 */
export const ANY = "any";

export interface CampFilters {
  /** `ANY` or a `YYYY-MM` month key. */
  month: string;
  /** `ANY` or a duration in days, as a string. */
  duration: string;
  /** `ANY` or a city name. */
  city: string;
}

export const DEFAULT_FILTERS: CampFilters = { month: ANY, duration: ANY, city: ANY };

/** `YYYY-MM` key for a camp's start date — null when the camp has no fixed start. */
export function monthKeyOf(startDate: string | null): string | null {
  return startDate ? startDate.slice(0, 7) : null;
}

/** "2026-09" → "September 2026". */
export function formatMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

/** "2026-09" → "September". The year is rendered separately in headings. */
export function monthName(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long" });
}

function matchesMonth(pkg: Package, month: string): boolean {
  return month === ANY || monthKeyOf(pkg.start_date) === month;
}

function matchesDuration(pkg: Package, duration: string): boolean {
  return duration === ANY || pkg.duration_days === Number(duration);
}

function matchesCity(pkg: Package, city: string): boolean {
  return city === ANY || (pkg.locations ?? []).some((l) => l.city === city);
}

export function filterCamps(packages: Package[], { month, duration, city }: CampFilters): Package[] {
  return packages.filter(
    (pkg) => matchesMonth(pkg, month) && matchesDuration(pkg, duration) && matchesCity(pkg, city)
  );
}

/** Months that still have camps to come, oldest first — the current month onwards. */
export function monthOptions(packages: Package[]): string[] {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const keys = packages
    .map((pkg) => monthKeyOf(pkg.start_date))
    .filter((key): key is string => key !== null && key >= currentMonth);
  return Array.from(new Set(keys)).sort();
}

/** Durations offered in the chosen month. */
export function durationOptions(packages: Package[], month: string): number[] {
  const pool = packages.filter((pkg) => matchesMonth(pkg, month));
  return Array.from(new Set(pool.map((pkg) => pkg.duration_days))).sort((a, b) => a - b);
}

/** Cities visited by the camps left after the month and duration picks. */
export function cityOptions(packages: Package[], month: string, duration: string): string[] {
  const pool = packages.filter((pkg) => matchesMonth(pkg, month) && matchesDuration(pkg, duration));
  const cities = new Set<string>();
  pool.forEach((pkg) => (pkg.locations ?? []).forEach((l) => l.city && cities.add(l.city)));
  return Array.from(cities).sort();
}

/**
 * Clears any pick the upstream filters no longer offer, so a select never holds
 * a value that is missing from its own option list.
 */
export function reconcileFilters(packages: Package[], filters: CampFilters): CampFilters {
  const month =
    filters.month === ANY || monthOptions(packages).includes(filters.month) ? filters.month : ANY;
  const duration =
    filters.duration === ANY || durationOptions(packages, month).includes(Number(filters.duration))
      ? filters.duration
      : ANY;
  const city =
    filters.city === ANY || cityOptions(packages, month, duration).includes(filters.city)
      ? filters.city
      : ANY;
  return { month, duration, city };
}

/**
 * Reads filters off the URL. Accepts `all` as an alias of `any` so older
 * "Secure Spot" links keep working.
 */
export function filtersFromParams(params: URLSearchParams): CampFilters {
  const read = (key: string) => {
    const value = params.get(key);
    return !value || value === ANY || value === "all" ? ANY : value;
  };
  return { month: read("month"), duration: read("duration"), city: read("city") };
}

export interface CampMonthGroup {
  /** `YYYY-MM`, or null for camps with no fixed start date. */
  key: string | null;
  /** Month name on its own — "October" — or "Dates TBA" when there is no start. */
  label: string;
  /** Rendered smaller beside the label; null for undated camps. */
  year: string | null;
  camps: Package[];
}

/**
 * Buckets camps under the month they depart in, earliest first. Camps with no
 * start date are grouped last, under "Dates TBA".
 */
export function groupCampsByMonth(packages: Package[]): CampMonthGroup[] {
  const buckets = new Map<string | null, Package[]>();
  packages.forEach((pkg) => {
    const key = monthKeyOf(pkg.start_date);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(pkg);
    else buckets.set(key, [pkg]);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a.localeCompare(b);
    })
    .map(([key, camps]) => ({
      key,
      label: key ? monthName(key) : "Dates TBA",
      year: key ? key.slice(0, 4) : null,
      camps,
    }));
}
