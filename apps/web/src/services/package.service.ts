import { API_ENDPOINTS } from "@/lib/api-constants";

export interface LocationDetails {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Package {
  id: number;
  name: string;
  description: string;
  price: string | number;
  duration_days: number;
  location: number;
  location_details?: LocationDetails;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const packageService = {
  async getPackages(): Promise<Package[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.PACKAGES}/`);
    if (!response.ok) throw new Error("Failed to fetch packages");
    const data: Package[] = await response.json();
    return data.filter(pkg => pkg.is_active);
  },

  async getPackagesByType(type: string): Promise<Package[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.PACKAGES}/?type=${type}`);
    if (!response.ok) throw new Error("Failed to fetch packages");
    const data: Package[] = await response.json();
    return data.filter(pkg => pkg.is_active);
  },

  async getPackageById(id: number): Promise<Package> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.PACKAGES}/${id}/`);
    if (!response.ok) throw new Error("Package not found");
    return response.json();
  },
};
