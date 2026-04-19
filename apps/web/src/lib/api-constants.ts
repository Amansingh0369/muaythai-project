export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL,
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
};

export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: "/auth/google/",
    REFRESH: "/auth/refresh/",
    LOGOUT: "/auth/logout/",
    ME: "/users/me/",
  },
  LOCATIONS: "/locations",
  PACKAGES: "/packages",
};
