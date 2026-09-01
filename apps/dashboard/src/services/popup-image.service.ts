import { API_ENDPOINTS } from "@/lib/api-constants";
import { fetchWithAuth } from "@/lib/api";

export interface PopupImage {
  id: number;
  /** Pre-signed S3 URL — it expires, so never cache it anywhere. */
  image: string;
  /** Admin-facing label for the library listing. */
  title: string;
  /** Rendered as the poster's alt text on the public popup. */
  alt_text: string;
  /** At most one image in the library is active — that one is what the site shows. */
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PopupImageMeta {
  title?: string;
  alt_text?: string;
}

export interface UploadPopupImageInput extends PopupImageMeta {
  is_active?: boolean;
}

const BASE = `${API_ENDPOINTS.POPUP_IMAGES}/`;

/**
 * Errors arrive as { error: true, message, data: { field: [msg] } }.
 * A field message ("Upload a valid image.") says far more than the generic
 * top-level one, so it wins when there is one.
 */
async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  if (!body) return fallback;

  if (body.data && typeof body.data === "object") {
    for (const value of Object.values(body.data)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === "string" && first.trim()) return first;
    }
  }

  return typeof body.message === "string" && body.message ? body.message : fallback;
}

export const popupImageService = {
  /** The whole library, newest first. */
  async getPopupImages(): Promise<PopupImage[]> {
    const response = await fetchWithAuth(BASE);
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to load popup images"));
    }
    return response.json();
  },

  /**
   * Upload a poster. Pass is_active to publish it in the same call, or leave
   * it off to stage the image in the library.
   *
   * Content-Type is intentionally NOT set — the browser has to add the
   * multipart boundary itself.
   */
  async uploadPopupImage(
    file: File,
    data: UploadPopupImageInput = {}
  ): Promise<PopupImage> {
    const fd = new FormData();
    fd.append("image", file);
    if (data.title !== undefined) fd.append("title", data.title);
    if (data.alt_text !== undefined) fd.append("alt_text", data.alt_text);
    // Only sent when going live; the server defaults a new upload to inactive.
    if (data.is_active) fd.append("is_active", "true");

    const response = await fetchWithAuth(BASE, { method: "POST", body: fd });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to upload image"));
    }
    return response.json();
  },

  /** Edit the label / alt text. No re-upload involved, so this one is JSON. */
  async updatePopupImage(id: number, data: PopupImageMeta): Promise<PopupImage> {
    const response = await fetchWithAuth(`${BASE}${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to update image"));
    }
    return response.json();
  },

  /** Make this the live image, standing down whichever was active. */
  async activatePopupImage(id: number): Promise<PopupImage> {
    const response = await fetchWithAuth(`${BASE}${id}/activate/`, { method: "POST" });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to set the current image"));
    }
    return response.json();
  },

  /** Switch the popup's image off, keeping it in the library. */
  async deactivatePopupImage(id: number): Promise<PopupImage> {
    const response = await fetchWithAuth(`${BASE}${id}/deactivate/`, { method: "POST" });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to turn the image off"));
    }
    return response.json();
  },

  /** Removes the row and the file from S3. */
  async deletePopupImage(id: number): Promise<void> {
    const response = await fetchWithAuth(`${BASE}${id}/`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to delete image"));
    }
  },
};
