/**
 * Error thrown by the password-reset service methods.
 *
 * `field` is set when the API blamed a specific input (e.g. `new_password`), so the
 * caller can surface the message under that field instead of as a form-level error.
 * `isTokenInvalid` is set when the reset link itself is bad or expired, so the caller
 * can route the user back to "request a new link".
 */
export class PasswordResetError extends Error {
  field?: string;
  isTokenInvalid: boolean;

  constructor(message: string, options: { field?: string; isTokenInvalid?: boolean } = {}) {
    super(message);
    this.name = "PasswordResetError";
    this.field = options.field;
    this.isTokenInvalid = options.isTokenInvalid ?? false;
  }
}

/** Keys that carry a human-readable message rather than a field name. */
const NON_FIELD_KEYS = new Set(["error", "detail", "message", "data"]);

/** Pull the first `{ field: ["msg"] }` pair out of an object, if there is one. */
function firstFieldError(source: unknown): { message: string; field: string } | null {
  if (!source || typeof source !== "object") return null;
  for (const [field, value] of Object.entries(source as Record<string, unknown>)) {
    if (NON_FIELD_KEYS.has(field)) continue;
    if (Array.isArray(value) && typeof value[0] === "string") {
      return { message: value[0], field };
    }
  }
  return null;
}

/**
 * Normalise the two error shapes the backend can produce.
 *
 * Views return their own errors verbatim — `{ error: "Invalid or expired token" }` — while
 * serializer failures are wrapped by the custom exception handler into
 * `{ error: true, message: "...", data: { new_password: ["..."] } }`. Note `error` is a
 * boolean in the wrapped shape, so it must never be read as a message.
 */
export function parsePasswordResetError(data: any, fallback: string): PasswordResetError {
  const fieldError = firstFieldError(data?.data) ?? firstFieldError(data);
  if (fieldError) {
    return new PasswordResetError(fieldError.message, { field: fieldError.field });
  }

  const message =
    (typeof data?.error === "string" && data.error) ||
    (typeof data?.detail === "string" && data.detail) ||
    (typeof data?.message === "string" && data.message) ||
    fallback;

  // "Invalid or expired token" / "Invalid link" both mean: the link is unusable.
  const isTokenInvalid = /invalid|expired/i.test(message);
  return new PasswordResetError(message, { isTokenInvalid });
}
