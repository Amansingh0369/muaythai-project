import { API_ENDPOINTS } from "@/lib/api-constants";
import { fetchWithAuth } from "@/lib/api";
import { Location } from "./location.service";

export interface Package {
  id: number;
  name: string;
  description: string;
  price: string | number;
  duration_days: number;
  location: number;
  location_details: Location;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreatePackageInput = Omit<Package, 'id' | 'location_details' | 'created_at' | 'updated_at'>;

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
        
        // Handle DRF style field errors
        const fieldErrors = Object.entries(errorData)
            .filter(([key]) => key !== 'detail' && key !== 'message')
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(' | ');

        const errorMessage = errorData.detail || errorData.message || fieldErrors || "Failed to create package";
        throw new Error(errorMessage);
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
        
        // Handle DRF style field errors
        const fieldErrors = Object.entries(errorData)
            .filter(([key]) => key !== 'detail' && key !== 'message')
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(' | ');

        const errorMessage = errorData.detail || errorData.message || fieldErrors || "Failed to update package";
        throw new Error(errorMessage);
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
