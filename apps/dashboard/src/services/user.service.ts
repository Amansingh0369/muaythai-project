import { API_ENDPOINTS } from "@/lib/api-constants";
import { fetchWithAuth } from "@/lib/api";

export type UserRole = "USER" | "ADMIN";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PRO";

/**
 * AdminUserSerializer flattens the nested profile onto the top-level object
 * via `to_representation`, so every profile field appears here directly.
 */
export interface AdminUser {
  id: number;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  // Flattened profile fields
  bio: string | null;
  profile_picture: string | null;
  experience: ExperienceLevel | null;
  weight: string | number | null;
  height: string | number | null;
  medical_conditions: string | null;
  allergies: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  passport: string | null;
  age: number | null;
  gender: Gender | null;
  phone: string | null;
}

/**
 * Editable fields via PATCH /users/{id}/.
 * `email`, `role`, `created_at` are read-only on the serializer (role has a
 * dedicated endpoint). Profile fields are sent flat and re-nested server-side.
 */
export interface UpdateUserInput {
  full_name?: string | null;
  is_active?: boolean;
  phone?: string | null;
  age?: number | null;
  gender?: Gender | null;
  experience?: ExperienceLevel | null;
  weight?: string | number | null;
  height?: string | number | null;
  bio?: string | null;
  medical_conditions?: string | null;
  allergies?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  passport?: string | null;
}

/** The two things a share can carry. Bookings and payments are not shareable. */
export type ShareSection = "customer" | "fighter_card";

export interface DossierRow {
  label: string;
  value: string;
}

export interface DossierBlock {
  /** Groups rows within a section ("Emergency contact"); "" for ungrouped. */
  subtitle: string;
  rows: DossierRow[];
}

export interface DossierSection {
  key: ShareSection;
  title: string;
  /** Set INSTEAD of blocks when there is nothing to show. Not an error. */
  note: string;
  blocks: DossierBlock[];
}

export interface SharePreview {
  user: number;
  customer_email: string;
  sections: DossierSection[];
}

/** The audit row a successful share writes. */
export interface ProfileShare {
  id: number;
  user: number;
  recipient_email: string;
  sections: ShareSection[];
  note: string;
  shared_by: number | null;
  shared_by_email: string | null;
  created_at: string;
}

export interface ShareProfileInput {
  email: string;
  sections?: ShareSection[];
  note?: string;
}

/**
 * Carries the status code, because the share flow has to tell a 502 ("the
 * email never went out, nothing was recorded") apart from a 400 validation
 * error — they need very different words in front of an admin.
 */
export class ShareApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ShareApiError";
    this.status = status;
  }
}

/**
 * Share endpoints fail in two different shapes.
 *
 * The views answer with a written `{"error": "..."}` — that text is meant for
 * the admin, so it wins. A DRF validation error instead comes through the
 * project's exception handler as `{error: true, message, data: {field: [...]}}`,
 * where `message` is `str(exc)` — a Python repr like
 * `{'email': [ErrorDetail(string='Enter a valid email address.')]}`. Never show
 * that: dig the field message out of `data` first.
 */
async function readShareError(response: Response, fallback: string): Promise<ShareApiError> {
  const body = await response.json().catch(() => null);

  if (typeof body?.error === "string" && body.error.trim()) {
    return new ShareApiError(body.error, response.status);
  }

  if (body?.data && typeof body.data === "object") {
    for (const value of Object.values(body.data)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === "string" && first.trim()) {
        return new ShareApiError(first, response.status);
      }
    }
  }

  const message =
    (typeof body?.message === "string" && body.message) ||
    (typeof body?.detail === "string" && body.detail) ||
    fallback;
  return new ShareApiError(message, response.status);
}

export const userService = {
  /**
   * Fetch all users (admin)
   */
  async getUsers(): Promise<AdminUser[]> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.USERS}/`);
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return response.json();
  },

  /**
   * Retrieve a single user (admin)
   */
  async getUser(id: number): Promise<AdminUser> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.USERS}/${id}/`);
    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }
    return response.json();
  },

  /**
   * Update a user — full_name, is_active and flat profile fields. PATCH only.
   */
  async updateUser(id: number, data: UpdateUserInput): Promise<AdminUser> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.USERS}/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || "Failed to update user");
    }

    return response.json();
  },

  /**
   * Change a user's role via the dedicated endpoint
   */
  async updateUserRole(id: number, role: UserRole): Promise<AdminUser> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.USERS}/${id}/role/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || "Failed to update role");
    }

    return response.json();
  },

  /**
   * What sharing this customer would send. Sends nothing itself — this is the
   * endpoint the share modal is built around, so an admin sees the passport
   * and medical rows before they leave.
   *
   * `sections` goes as a comma-separated query string; omit it for everything.
   * Never send an empty list — the API rejects that.
   */
  async previewProfileShare(id: number, sections?: ShareSection[]): Promise<SharePreview> {
    const query = sections?.length ? `?sections=${sections.join(",")}` : "";
    const response = await fetchWithAuth(
      `${API_ENDPOINTS.USERS}/${id}/share/preview/${query}`
    );

    if (!response.ok) {
      throw await readShareError(response, "Failed to load the preview");
    }

    return response.json();
  },

  /**
   * Email the dossier and record the share.
   *
   * A 502 means the mail did not go out and no audit row was written — the
   * caller must say so rather than reporting success.
   */
  async shareProfile(id: number, input: ShareProfileInput): Promise<ProfileShare> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.USERS}/${id}/share/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw await readShareError(response, "Failed to share the profile");
    }

    return response.json();
  },

  /** Who this customer has already been shared with, newest first. */
  async getProfileShares(id: number): Promise<ProfileShare[]> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.USERS}/${id}/shares/`);
    if (!response.ok) {
      throw await readShareError(response, "Failed to load the share history");
    }
    return response.json();
  },

  /**
   * Soft-delete a user (sets is_active=False server-side)
   */
  async deleteUser(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.USERS}/${id}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete user");
    }
  },
};
