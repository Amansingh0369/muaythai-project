export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL,
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
};

export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: "/auth/google/",
    LOGIN: "/auth/login/",
    REGISTER: "/auth/register/",
    VERIFY_EMAIL: "/auth/verify-email/",
    VERIFY_EMAIL_RESEND: "/auth/verify-email/resend/",
    PASSWORD_RESET: "/auth/password-reset/",
    PASSWORD_RESET_CONFIRM: "/auth/password-reset-confirm/",
    REFRESH: "/auth/refresh/",
    LOGOUT: "/auth/logout/",
    ME: "/users/me/",
  },
  LOCATIONS: "/locations",
  PACKAGES: "/packages",
  ORDERS: "/orders",
  PAYMENTS: {
    CREATE_ORDER: "/payments/create-order/",
    VERIFY: "/payments/verify/",
    HISTORY: "/payments/history/",
  },
};
