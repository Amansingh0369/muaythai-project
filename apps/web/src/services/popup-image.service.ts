import { API_ENDPOINTS } from "@/lib/api-constants";

export interface PopupImage {
  id: number;
  /** Pre-signed S3 URL — it expires, so always read it fresh from the API. */
  image: string;
  /** Admin-facing label, only used in the dashboard's library listing. */
  title: string;
  /** Rendered as the poster's alt text. */
  alt_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const popupImageService = {
  /**
   * The poster the homepage popup should show, or null when an admin has
   * switched the image off (or never uploaded one).
   *
   * Public — no auth, so it must work for logged-out visitors.
   */
  async getActivePopupImage(): Promise<PopupImage | null> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.POPUP_IMAGES}/active/`
      );
      if (!response.ok) return null;

      // "No image active" comes back as 200 with an *empty* body, not the
      // literal `null` the API doc promises — DRF renders Response(None) as
      // zero bytes. res.json() would throw on that, so read text and only
      // parse when there is something to parse.
      const body = await response.text();
      return body.trim() ? (JSON.parse(body) as PopupImage | null) : null;
    } catch {
      // The popup already fails silently on error and must keep doing so:
      // a missing poster can never be a reason to hide a departure.
      return null;
    }
  },
};
