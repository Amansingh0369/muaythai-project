/**
 * Handles the Google credential response on the login page.
 * Returns the credential string if valid, otherwise null.
 */
export function extractCredential(credentialResponse: { credential?: string }): string | null {
  return credentialResponse.credential ?? null;
}

/**
 * Redirect path to use after successful login.
 * Defaults to "/" if no redirect param is provided.
 */
export function getRedirectPath(searchParams: URLSearchParams | null): string {
  return searchParams?.get("redirect") || "/";
}
