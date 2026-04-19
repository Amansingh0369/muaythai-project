import { API_CONFIG, API_ENDPOINTS } from "@/lib/api-constants";
import { fetchWithAuth } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  phone_no: string | null;
  role: string;
  google_id: string | null;
  is_active: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  created_at: string;
}

export interface AuthResponse {
  access: string;
  user: User;
}

export const authService = {
  /**
   * Log in with a Google ID Token
   */
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: "Login failed" };
        }
        throw new Error(errorData.detail || errorData.message || "Login failed");
    }

    return response.json();
  },

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    await fetchWithAuth(API_ENDPOINTS.AUTH.LOGOUT, { method: "POST" });
  },

  /**
   * Get the current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await fetchWithAuth(API_ENDPOINTS.AUTH.ME);
    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }
    return response.json();
  },
};
