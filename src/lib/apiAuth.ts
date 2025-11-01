import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { AuthenticationError, AuthorizationError } from './errors';
import { User } from '@/types/auth';

/**
 * API authentication middleware (cookie-based with Supabase)
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  user: User | null;
  role: string;
}> {
  // Check auth-token cookie (primary auth method)
  const authToken = request.cookies.get('auth-token')?.value;

  if (!authToken) {
    throw new AuthenticationError('Authentication required');
  }

  // Verify with Supabase for user data
  const supabase = await createRouteHandlerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new AuthenticationError('Authentication required');
  }

  // Get user profile from database
  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      createdAt: true,
      lastLogin: true,
      updatedAt: true,
    },
  });

  if (!profile) {
    throw new AuthenticationError('User profile not found');
  }

  // Map to User type
  const user: User = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    avatar: profile.avatar || undefined,
    role: profile.role as 'user' | 'admin' | 'moderator',
    permissions: [], // Default empty permissions array
    lastLoginAt: profile.lastLogin || undefined,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };

  return {
    user,
    role: profile.role,
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
