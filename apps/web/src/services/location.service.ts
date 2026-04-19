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

export const locationService = {
  /**
   * Fetch all locations from the backend
   */
  async getLocations(): Promise<Location[]> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.LOCATIONS}/`);
    if (!response.ok) {
        throw new Error("Failed to fetch locations");
    }
    return response.json();
  },
};
