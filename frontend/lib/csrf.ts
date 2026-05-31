/**
 * CSRF Protection Utilities
 * Implements double-submit cookie + synchronizer token pattern
 */

const CSRF_HEADER = "X-CSRF-Token";
const CSRF_COOKIE_NAME = "vetworld_csrf";

/**
 * Get the CSRF token from the cookie
 */
export function getCsrfToken(): string | null {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie
        .split("; ")
        .reduce((acc, cookie) => {
            const [name, value] = cookie.split("=");
            acc[decodeURIComponent(name)] = decodeURIComponent(value);
            return acc;
        }, {} as Record<string, string>);

    return cookies[CSRF_COOKIE_NAME] || null;
}

/**
 * Add CSRF token to request headers
 */
export function addCsrfHeader(headers: Record<string, string>): Record<string, string> {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
        headers[CSRF_HEADER] = csrfToken;
    }
    return headers;
}

/**
 * Store CSRF token from set-token response
 */
export async function storeCsrfToken(token: string): Promise<void> {
    // Token is already in cookie from set-token route, but we can validate it's accessible
    if (!getCsrfToken()) {
        console.warn("CSRF token not found in cookies");
    }
}
