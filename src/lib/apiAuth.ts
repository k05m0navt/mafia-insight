import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AuthenticationError, AuthorizationError } from './errors';

/**
 * API authentication middleware
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  user: any;
  role: string;
}> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    throw new AuthenticationError('Authentication required');
  }

  return {
    user: token,
    role: (token as any).role || 'USER',
  };
}

/**
 * Check if user has required role for API access
 */
export function requireRole(userRole: string, requiredRole: string): void {
  const roleHierarchy: Record<string, number> = {
    GUEST: 0,
    USER: 1,
    ADMIN: 2,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    throw new AuthorizationError(`Role '${requiredRole}' required`);
  }
}

/**
 * Check API key for admin operations
 */
export function validateApiKey(request: NextRequest): void {
  const apiKey = request.headers.get('x-api-key');
  const expectedApiKey = process.env.ADMIN_API_KEY;

  if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
    throw new AuthorizationError('Valid API key required');
  }
}

/**
 * Middleware for protected API routes
 */
export function withAuth(requiredRole: string = 'USER') {
  return async function authMiddleware(request: NextRequest) {
    const { user, role } = await authenticateRequest(request);
    requireRole(role, requiredRole);

    return { user, role };
  };
}

/**
 * Middleware for admin API routes
 */
export function withAdminAuth() {
  return async function adminAuthMiddleware(request: NextRequest) {
    // Check API key first
    validateApiKey(request);

    // Also check authentication if available
    try {
      const { user, role } = await authenticateRequest(request);
      requireRole(role, 'ADMIN');
      return { user, role };
    } catch {
      // If authentication fails, still allow if API key is valid
      return { user: null, role: 'ADMIN' };
    }
  };
}
