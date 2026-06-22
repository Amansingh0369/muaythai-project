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

// ── Field mapping (frontend ↔ backend) ────────────────────────────────────────
// The backend flattens the profile onto the user root and uses different field
// names for a few fields. These adapters translate both directions so the rest
// of the app can keep using the nested `{ profile: {...} }` shape.

// frontend profile key  ->  backend (flat) key
const PROFILE_FIELD_MAP: Record<keyof UserProfile, string> = {
  bio: "bio",
  profile_picture: "profile_picture",
  experience_level: "experience",
  weight_kg: "weight",
  height_cm: "height",
  medical_conditions: "medical_conditions",
  allergies: "allergies",
  emergency_contact_name: "emergency_contact_name",
  emergency_contact_phone: "emergency_contact_phone",
  passport_number: "passport",
  age: "age",
  gender: "gender",
  phone_no: "phone",
};

// Read a flat backend value, falling back to a (legacy) nested `profile` object.
function pick(data: any, backendKey: string): any {
  const flat = data?.[backendKey];
  if (flat !== undefined) return flat;
  return data?.profile?.[backendKey];
}

// Backend response (flat) -> nested FullUser the app expects
function mapUserResponse(data: any): FullUser {
  const profile = {} as UserProfile;
  (Object.keys(PROFILE_FIELD_MAP) as (keyof UserProfile)[]).forEach((feKey) => {
    (profile as any)[feKey] = pick(data, PROFILE_FIELD_MAP[feKey]) ?? null;
  });
  // experience defaults to BEGINNER on the backend
  if (profile.experience_level == null) profile.experience_level = "BEGINNER";

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name ?? null,
    role: data.role,
    google_id: data.google_id ?? null,
    is_active: data.is_active,
    created_at: data.created_at,
    profile,
    orders: data.orders ?? [],
    liked_packages: data.liked_packages ?? [],
  };
}

// Nested update payload -> flat body the backend expects
function toFlatPayload(payload: UpdateProfilePayload): Record<string, any> {
  const body: Record<string, any> = {};
  if (payload.full_name !== undefined) body.full_name = payload.full_name;
  const pr = payload.profile;
  if (pr) {
    (Object.keys(pr) as (keyof UserProfile)[]).forEach((feKey) => {
      const backendKey = PROFILE_FIELD_MAP[feKey];
      if (backendKey && pr[feKey] !== undefined) body[backendKey] = pr[feKey];
    });
  }
  return body;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const userService = {
  async getFullProfile(): Promise<FullUser> {
    const res = await fetchWithAuth(API_ENDPOINTS.AUTH.ME);
    if (!res.ok) throw new Error("Failed to fetch profile");
    const data = await res.json();
    return mapUserResponse(data);
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<FullUser> {
    const res = await fetchWithAuth(API_ENDPOINTS.AUTH.ME, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toFlatPayload(payload)),
    });
    let data: any;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) throw new Error(data.detail || data.error || data.message || "Update failed");
    return mapUserResponse(data);
  },
};
