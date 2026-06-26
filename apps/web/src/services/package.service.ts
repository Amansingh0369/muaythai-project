import { API_ENDPOINTS } from "@/lib/api-constants";

export type PackageKind = "INDIVIDUAL" | "GROUP";
export type PackageType = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface LocationDetails {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Package {
  id: number;
  name: string;
  kind: PackageKind;
  type: PackageType;
  description: string;
  price: string | number;
  start_date: string | null;
  duration_days: number;
  /** Array now (was a single `location` object before). INDIVIDUAL → 1, GROUP → 2+. */
  locations: LocationDetails[];
  ideal_for: string[];
  training: string[];
  experience: string[];
  accommodation: string[];
  included: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackageFilters {
  type?: string;
  kind?: PackageKind;
  /** Matches any package whose `locations` array includes this location id. */
  location?: number;
}

function buildPackageQuery(filters: PackageFilters): string {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.location != null) params.set("location", String(filters.location));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Human-readable location label for a package.
 * INDIVIDUAL → the single city/name; GROUP → all joined ("Phuket + Bangkok + Krabi").
 */
export function packageLocationNames(pkg: Package): string {
  const names = (pkg.locations ?? [])
    .map((l) => l.city || l.name)
    .filter(Boolean);
  if (names.length === 0) return "Thailand";
  return names.join(" + ");
}

export const packageService = {
  async getPackages(filters: PackageFilters = {}): Promise<Package[]> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.PACKAGES}/${buildPackageQuery(filters)}`
    );
    if (!response.ok) throw new Error("Failed to fetch packages");
    const data: Package[] = await response.json();
    return data.filter((pkg) => pkg.is_active);
  },

  async getPackagesByType(type: string, kind?: PackageKind): Promise<Package[]> {
    return packageService.getPackages({ type, kind });
  },

  async getPackageById(id: number): Promise<Package> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.PACKAGES}/${id}/`
    );
    if (!response.ok) throw new Error("Package not found");
    return response.json();
  },
};
