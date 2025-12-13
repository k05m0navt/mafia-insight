import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { withAdminAuth, requireRole, authenticateRequest } from '@/lib/apiAuth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors';
import { prisma } from '@/lib/db';
import {
  createTestUser,
  createTestAdmin,
  clearTestDatabase,
} from '../../setup';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Admin Route Protection Middleware', () => {
  beforeEach(async () => {
    await clearTestDatabase();
    vi.clearAllMocks();
  });

  describe('requireRole', () => {
    it('allows admin role for admin requirement', () => {
      expect(() => requireRole('admin', 'admin')).not.toThrow();
    });

    it('allows admin role for user requirement', () => {
      expect(() => requireRole('admin', 'user')).not.toThrow();
    });

    it('allows user role for user requirement', () => {
      expect(() => requireRole('user', 'user')).not.toThrow();
    });

    it('throws AuthorizationError when user role is lower than required', () => {
      expect(() => requireRole('user', 'admin')).toThrow(AuthorizationError);
      expect(() => requireRole('guest', 'admin')).toThrow(AuthorizationError);
      expect(() => requireRole('guest', 'user')).toThrow(AuthorizationError);
    });

    it('handles case-insensitive role comparison', () => {
      expect(() => requireRole('ADMIN', 'admin')).not.toThrow();
      expect(() => requireRole('Admin', 'ADMIN')).not.toThrow();
      expect(() => requireRole('USER', 'admin')).toThrow(AuthorizationError);
    });

    it('treats unknown roles as guest level', () => {
      expect(() => requireRole('unknown', 'user')).toThrow(AuthorizationError);
      expect(() => requireRole('unknown', 'admin')).toThrow(AuthorizationError);
    });
  });

  describe('authenticateRequest', () => {
    it('throws AuthenticationError when auth-token cookie is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {},
      });

      await expect(authenticateRequest(request)).rejects.toThrow(
        AuthenticationError
      );
    });

    it('throws AuthenticationError when Supabase user is not found', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          cookie: 'auth-token=test-token',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(authenticateRequest(request)).rejects.toThrow(
        AuthenticationError
      );
    });

    it('throws AuthenticationError when user profile is not found in database', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          cookie: 'auth-token=test-token',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authenticateRequest(request)).rejects.toThrow(
        AuthenticationError
      );
    });

    it('returns user and role when authentication succeeds', async () => {
      const adminUser = await createTestAdmin({
        email: 'admin@example.com',
        name: 'Admin User',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          cookie: 'auth-token=test-token',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: adminUser.id } },
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: 'admin',
        avatar: null,
        createdAt: adminUser.createdAt,
        lastLogin: null,
        updatedAt: adminUser.updatedAt,
      } as any);

      const result = await authenticateRequest(request);

      expect(result.user.id).toBe(adminUser.id);
      expect(result.user.email).toBe(adminUser.email);
      expect(result.role).toBe('admin');
    });
  });

  describe('withAdminAuth', () => {
    it('throws AuthenticationError when user is not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {},
      });

      await expect(withAdminAuth(request)).rejects.toThrow(AuthenticationError);
    });

    it('throws AuthorizationError when user is not admin', async () => {
      const regularUser = await createTestUser({
        email: 'user@example.com',
        role: 'user',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          cookie: 'auth-token=test-token',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: regularUser.id } },
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: regularUser.id,
        email: regularUser.email,
        name: regularUser.name,
        role: 'user',
        avatar: null,
        createdAt: regularUser.createdAt,
        lastLogin: null,
        updatedAt: regularUser.updatedAt,
      } as any);

      await expect(withAdminAuth(request)).rejects.toThrow(AuthorizationError);
    });

    it('returns user and role when user is admin', async () => {
      const adminUser = await createTestAdmin({
        email: 'admin@example.com',
        name: 'Admin User',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          cookie: 'auth-token=test-token',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: adminUser.id } },
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: 'admin',
        avatar: null,
        createdAt: adminUser.createdAt,
        lastLogin: null,
        updatedAt: adminUser.updatedAt,
      } as any);

      const result = await withAdminAuth(request);

      expect(result.user.id).toBe(adminUser.id);
      expect(result.user.role).toBe('admin');
      expect(result.role).toBe('admin');
    });
  });
});
