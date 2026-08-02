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

export interface CreateLocationInput {
  name: string;
  address: string;
  city: string;
  latitude: number | string | null;
  longitude: number | string | null;
}

/**
 * Build multipart/form-data for a location write.
 * Repeats `uploaded_images` per file and `remove_image_ids` per id, as the API requires.
 * Content-Type is intentionally NOT set — the browser adds the multipart boundary.
 */
function buildLocationFormData(
  data: Partial<CreateLocationInput>,
  files: File[],
  removeImageIds: number[] = []
): FormData {
  const fd = new FormData();

  if (data.name !== undefined) fd.append("name", data.name);
  if (data.address !== undefined) fd.append("address", data.address);
  if (data.city !== undefined) fd.append("city", data.city);
  // latitude/longitude are optional — only send when the admin actually provided a value.
  if (data.latitude != null && `${data.latitude}` !== "") fd.append("latitude", `${data.latitude}`);
  if (data.longitude != null && `${data.longitude}` !== "") fd.append("longitude", `${data.longitude}`);

  files.forEach((file) => fd.append("uploaded_images", file));
  removeImageIds.forEach((id) => fd.append("remove_image_ids", String(id)));

  return fd;
}

export const locationService = {
  /**
   * Fetch all locations (each with its `images` array).
   */
  async getLocations(): Promise<Location[]> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.LOCATIONS}/`);
    if (!response.ok) {
      throw new Error("Failed to fetch locations");
    }
    return response.json();
  },

  /**
   * Create a new location, uploading any selected image files.
   */
  async createLocation(data: CreateLocationInput, files: File[] = []): Promise<Location> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.LOCATIONS}/`, {
      method: "POST",
      body: buildLocationFormData(data, files),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || "Failed to create location");
    }

    return response.json();
  },

  /**
   * Update a location: change text fields, append new image files, and/or
   * delete existing images (by id) — all in a single multipart request.
   */
  async updateLocation(
    id: number,
    data: Partial<CreateLocationInput>,
    files: File[] = [],
    removeImageIds: number[] = []
  ): Promise<Location> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.LOCATIONS}/${id}/`, {
      method: "PATCH",
      body: buildLocationFormData(data, files, removeImageIds),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || "Failed to update location");
    }

    return response.json();
  },

  /**
   * Delete a location (409 if attached to packages).
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
