import { API_CONFIG, API_ENDPOINTS } from "@/lib/api-constants";
import { fetchWithAuth } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  google_id: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access: string;
  user: User;
}

export interface MessageResponse {
  message: string;
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
   * Register — backend sends a verification email. Returns { message } only, no token.
   */
  async register(fullName: string, email: string, password: string): Promise<MessageResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ full_name: fullName, email, password }),
    });
    let data: any;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) {
      // Field-level errors: { data: { email: ["..."], password: ["..."] } }
      if (data.data && typeof data.data === "object") {
        const firstField = Object.values(data.data)[0];
        if (Array.isArray(firstField) && firstField.length > 0) {
          throw new Error(firstField[0] as string);
        }
      }
      throw new Error(data.detail || data.message || "Registration failed");
    }
    return data as MessageResponse;
  },

  /** Verify email address using uid + token from the link */
  async verifyEmail(uid: string, token: string): Promise<MessageResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_EMAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, token }),
    });
    let data: any;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) throw new Error(data.detail || data.error || data.message || "Verification failed");
    return data as MessageResponse;
  },

  /** Resend verification email */
  async resendVerification(email: string): Promise<MessageResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_EMAIL_RESEND}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    let data: any;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) throw new Error(data.detail || data.error || data.message || "Failed to resend");
    return data as MessageResponse;
  },

  /** Request a password reset link */
  async requestPasswordReset(email: string): Promise<MessageResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.PASSWORD_RESET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    let data: any;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) throw new Error(data.detail || data.error || data.message || "Failed");
    return data as MessageResponse;
  },

  /** Confirm password reset */
  async confirmPasswordReset(uid: string, token: string, newPassword: string): Promise<MessageResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, token, new_password: newPassword }),
    });
    let data: any;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) throw new Error(data.detail || data.error || data.message || "Failed");
    return data as MessageResponse;
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
