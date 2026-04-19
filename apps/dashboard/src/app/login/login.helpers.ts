/**
 * Extract credential from Google Login response
 */
export const extractCredential = (response: any): string | null => {
    if (response?.credential) {
        return response.credential;
    }
    return null;
};

/**
 * Determine where to redirect after login
 */
export const getRedirectPath = (searchParams: URLSearchParams | null): string => {
    const redirect = searchParams?.get("redirect");
    return redirect || "/dashboard";
};
