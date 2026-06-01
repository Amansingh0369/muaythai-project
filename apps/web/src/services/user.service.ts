import { fetchWithAuth } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  bio: string | null;
  profile_picture: string | null;
  experience_level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PRO";
  weight_kg: string | null;
  height_cm: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  passport_number: string | null;
  age: number | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  phone_no: string | null;
}

export interface UserOrder {
  id: string;
  package_name: string;
  total_amount: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  created_at: string;
}

export interface LikedPackage {
  package_id: number;
  package_name: string;
  created_at: string;
}

export interface FullUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  google_id: string | null;
  is_active: boolean;
  created_at: string;
  profile: UserProfile;
  orders: UserOrder[];
  liked_packages: LikedPackage[];
}

export interface UpdateProfilePayload {
  full_name?: string;
  profile?: Partial<UserProfile>;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const userService = {
  async getFullProfile(): Promise<FullUser> {
    const res = await fetchWithAuth(API_ENDPOINTS.AUTH.ME);
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<FullUser> {
    const res = await fetchWithAuth(API_ENDPOINTS.AUTH.ME, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data: any;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) throw new Error(data.detail || data.error || data.message || "Update failed");
    return data as FullUser;
  },
};
