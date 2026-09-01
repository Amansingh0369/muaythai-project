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
    PASSWORD_RESET_VALIDATE: "/auth/password-reset/validate/",
    PASSWORD_RESET_CONFIRM: "/auth/password-reset-confirm/",
    REFRESH: "/auth/refresh/",
    LOGOUT: "/auth/logout/",
    ME: "/users/me/",
  },
  FIGHTER_CARDS: {
    /** Public. Every choice set, caps, scale labels — cache it. */
    OPTIONS: "/fighter-cards/options/",
    /** Creates the card on first read, so it is safe to call on page load. */
    ME: "/fighter-cards/me/",
    /** PUT multipart to upload/replace, DELETE to remove. Never part of the PATCH. */
    PHOTO: "/fighter-cards/me/photo/",
  },
  LOCATIONS: "/locations",
  PACKAGES: "/packages",
  /** Public `active/`; every other verb is admin-only (dashboard). */
  POPUP_IMAGES: "/popup-images",
  ORDERS: "/orders",
  COUPONS: "/coupons",
  PAYMENTS: {
    CREATE_ORDER: "/payments/create-order/",
    VERIFY: "/payments/verify/",
    HISTORY: "/payments/history/",
  },
};
