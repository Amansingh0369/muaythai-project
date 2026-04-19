import { API_ENDPOINTS } from "@/lib/api-constants";

export interface Package {
  id: number;
  name: string;
  description: string;
  price: string | number;
  duration_days: number;
  location: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const packageService = {
  /**
   * Fetch all active packages for the public site
   */
  async getPackages(): Promise<Package[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.PACKAGES}/`);
    if (!response.ok) {
        throw new Error("Failed to fetch packages");
    }
    const data: Package[] = await response.json();
    return data.filter(pkg => pkg.is_active);
  },
};
