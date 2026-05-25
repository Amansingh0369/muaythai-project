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
  created_at: string;
}

export interface AuthResponse {
  access: string;
  user: User;
}

export const authService = {
  /**
   * Log in with email + password
   */
  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    let data: any;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) throw new Error(data.detail || data.message || "Login failed");
    return data as AuthResponse;
  },

  /**
   * Register a new user with email + password
   */
  async register(fullName: string, email: string, phone: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ full_name: fullName, email, phone_no: phone, password }),
    });
    let data: any;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) throw new Error(data.detail || data.message || "Registration failed");
    return data as AuthResponse;
  },

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
