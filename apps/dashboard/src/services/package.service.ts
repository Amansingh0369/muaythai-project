import { API_ENDPOINTS } from "@/lib/api-constants";
import { fetchWithAuth } from "@/lib/api";
import { Location } from "./location.service";

export type PackageType = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type PackageKind = 'INDIVIDUAL' | 'GROUP';

export interface Package {
  id: number;
  name: string;
  kind: PackageKind;
  type: PackageType;
  description: string;
  price: string | number;
  start_date: string | null;
  duration_days: number;
  /** Array now (was single `location`/`location_details`). INDIVIDUAL → 1, GROUP → 2+. */
  locations: Location[];
  ideal_for: string[];
  training: string[];
  experience: string[];
  accommodation: string[];
  included: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create/update payload. Note: locations are sent as `location_ids` (array of ids),
 * NOT as `locations`. The 5 content sections are arrays of strings.
 */
export interface CreatePackageInput {
  name: string;
  kind: PackageKind;
  type: PackageType;
  description: string;
  price: string | number;
  start_date: string | null;
  duration_days: number;
  location_ids: number[];
  ideal_for: string[];
  training: string[];
  experience: string[];
  accommodation: string[];
  included: string[];
  is_active: boolean;
}

export type PackageFieldErrors = Record<string, string[]>;

/** Carries DRF field-level validation errors so the form can render them inline. */
export class PackageApiError extends Error {
  fieldErrors: PackageFieldErrors;
  constructor(message: string, fieldErrors: PackageFieldErrors) {
    super(message);
    this.name = "PackageApiError";
    this.fieldErrors = fieldErrors;
  }
}

function normalizeFieldErrors(errorData: unknown): PackageFieldErrors {
  const out: PackageFieldErrors = {};
  if (errorData && typeof errorData === "object") {
    for (const [key, value] of Object.entries(errorData as Record<string, unknown>)) {
      if (key === "detail" || key === "message") continue;
      out[key] = Array.isArray(value) ? value.map(String) : [String(value)];
    }
  }
  return out;
}

function buildErrorMessage(
  errorData: any,
  fieldErrors: PackageFieldErrors,
  fallback: string
): string {
  const flat = Object.entries(fieldErrors)
    .map(([k, v]) => `${k}: ${v.join(", ")}`)
    .join(" | ");
  return errorData?.detail || errorData?.message || flat || fallback;
}

export const packageService = {
  /**
   * Fetch all packages
   */
  async getPackages(): Promise<Package[]> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.PACKAGES}/`);
    if (!response.ok) {
        throw new Error("Failed to fetch packages");
    }
    return response.json();
  },

  /**
   * Create a new package
   */
  async createPackage(data: CreatePackageInput): Promise<Package> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.PACKAGES}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const fieldErrors = normalizeFieldErrors(errorData);
        throw new PackageApiError(
          buildErrorMessage(errorData, fieldErrors, "Failed to create package"),
          fieldErrors
        );
    }

    return response.json();
  },

  /**
   * Update an existing package
   */
  async updatePackage(id: number, data: Partial<CreatePackageInput>): Promise<Package> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.PACKAGES}/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const fieldErrors = normalizeFieldErrors(errorData);
        throw new PackageApiError(
          buildErrorMessage(errorData, fieldErrors, "Failed to update package"),
          fieldErrors
        );
    }

    return response.json();
  },

  /**
   * Delete a package
   */
  async deletePackage(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.PACKAGES}/${id}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Failed to delete package");
    }
  },
};
