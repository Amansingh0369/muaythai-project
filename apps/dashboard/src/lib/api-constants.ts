export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL,
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login/",
    GOOGLE: "/auth/google/",
    REFRESH: "/auth/refresh/",
    LOGOUT: "/auth/logout/",
    ME: "/users/me/",
  },
  LOCATIONS: "/locations",
  PACKAGES: "/packages",
  ORDERS: "/orders",
  USERS: "/users",
  REVIEWS: "/reviews",
  PAYMENTS: "/payments",
  COUPONS: "/coupons",
  // Analytics is mounted at /api/admin/analytics/ (note the /admin/ segment)
  ANALYTICS: {
    OVERVIEW: "/admin/analytics/",
    REVENUE: "/admin/analytics/revenue/",
    USERS: "/admin/analytics/users/",
    ORDERS: "/admin/analytics/orders/",
    LOCATIONS: "/admin/analytics/locations/",
    VISITORS: "/admin/analytics/visitors/",
  },
};
