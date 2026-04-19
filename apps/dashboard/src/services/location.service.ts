import { API_ENDPOINTS } from "@/lib/api-constants";
import { fetchWithAuth } from "@/lib/api";

export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number | string | null;
  longitude: number | string | null;
  created_at: string;
  updated_at: string;
}

export type CreateLocationInput = Omit<Location, 'id' | 'created_at' | 'updated_at'>;

export const locationService = {
  /**
   * Fetch all locations
   */
  async getLocations(): Promise<Location[]> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.LOCATIONS}/`);
    if (!response.ok) {
        throw new Error("Failed to fetch locations");
    }
    return response.json();
  },

  /**
   * Create a new location
   */
  async createLocation(data: CreateLocationInput): Promise<Location> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.LOCATIONS}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to create location");
    }

    return response.json();
  },

  /**
   * Update an existing location
   */
  async updateLocation(id: number, data: Partial<CreateLocationInput>): Promise<Location> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.LOCATIONS}/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to update location");
    }

    return response.json();
  },

  /**
   * Delete a location
   */
  async deleteLocation(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.LOCATIONS}/${id}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Failed to delete location");
    }
  },
};
