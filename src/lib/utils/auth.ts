/**
 * Cookie utility functions for authentication
 * Used to read auth-token cookie on client-side
 */

/**
 * Get a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Get the auth-token cookie value
 * @returns Auth token string or null if not found
 */
export function getAuthTokenCookie(): string | null {
  return getCookie('auth-token');
}

/**
 * Check if auth-token cookie exists
 * @returns True if cookie exists, false otherwise
 */
export function hasAuthTokenCookie(): boolean {
  return !!getAuthTokenCookie();
}
