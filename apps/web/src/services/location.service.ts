import { API_ENDPOINTS } from "@/lib/api-constants";
import { fetchWithAuth } from "@/lib/api";

export interface LocationImage {
  id: number;
  image: string;
  caption: string | null;
  position: number;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number | string | null;
  longitude: number | string | null;
  images: LocationImage[];
  created_at: string;
  updated_at: string;
}

export const locationService = {
  /**
   * Fetch all locations from the backend (each with its `images` array).
   */
  async getLocations(): Promise<Location[]> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.LOCATIONS}/`);
    if (!response.ok) {
      throw new Error("Failed to fetch locations");
    }
    return response.json();
  },

  /**
   * Fetch a single location (with its `images` array) by id.
   */
  async getLocationById(id: number): Promise<Location> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.LOCATIONS}/${id}/`);
    if (!response.ok) {
      throw new Error("Location not found");
    }
    return response.json();
  },
};
