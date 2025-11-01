import { NextRequest, NextResponse } from 'next/server';

/**
 * Get auth-token cookie value from request
 */
export function getAuthTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || null;
}

/**
 * Check if request has valid auth-token cookie
 */
export function hasAuthToken(request: NextRequest): boolean {
  return !!getAuthTokenFromRequest(request);
}

/**
 * Validate authentication and return unauthorized response if missing
 * Returns null if authenticated, or NextResponse with 401 if not
 */
export function requireAuthCookie(request: NextRequest): NextResponse | null {
  const authToken = getAuthTokenFromRequest(request);

  if (!authToken) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        message: 'Please sign in to access this resource',
        code: 'AUTHENTICATION_ERROR',
      },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Set auth-token cookie in response
 */
export function setAuthTokenCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date
): NextResponse {
  const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

  response.cookies.set('auth-token', token, {
    httpOnly: false, // Client-side needs access for Zustand store sync
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAge > 0 ? maxAge : 24 * 60 * 60, // Fallback to 24h
  });

  return response;
}

/**
 * Set user-role cookie in response
 */
export function setUserRoleCookie(
  response: NextResponse,
  role: string,
  expiresAt: Date
): NextResponse {
  const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

  response.cookies.set('user-role', role, {
    httpOnly: false, // Client-side needs access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAge > 0 ? maxAge : 24 * 60 * 60, // Fallback to 24h
  });

  return response;
}

/**
 * Clear auth cookies in response
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set('auth-token', '', {
    maxAge: 0,
    path: '/',
  });
  response.cookies.set('user-role', '', {
    maxAge: 0,
    path: '/',
  });

  return response;
}
