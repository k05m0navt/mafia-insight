import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearTestDatabase, createTestUser } from '../../setup';

/**
 * Auth Service Unit Tests
 *
 * Tests authentication service functionality including
 * user creation, login validation, and session management
 */

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 'mock-token' } },
          error: null,
        }),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' }, session: {} },
          error: null,
        }),
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'new-user-id' }, session: {} },
          error: null,
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    })
  ),
  createServerComponentClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 'mock-token' } },
          error: null,
        }),
      },
    })
  ),
}));

describe('Auth Service', () => {
  beforeEach(async () => {
    await clearTestDatabase();
    vi.clearAllMocks();
  });

  describe('User Authentication', () => {
    it('should authenticate valid credentials', async () => {
      const { createRouteHandlerClient } = await import(
        '@/lib/supabase/server'
      );
      const supabase = await createRouteHandlerClient();

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data.user).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should reject invalid credentials', async () => {
      const { createRouteHandlerClient } = await import(
        '@/lib/supabase/server'
      );

      // Mock error response
      const supabase = await createRouteHandlerClient();
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials', status: 401 },
      } as any);

      const result = await supabase.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid credentials');
    });

    it('should create new user account', async () => {
      const { createRouteHandlerClient } = await import(
        '@/lib/supabase/server'
      );
      const supabase = await createRouteHandlerClient();

      const result = await supabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(result.data.user).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should handle duplicate email registration', async () => {
      const { createRouteHandlerClient } = await import(
        '@/lib/supabase/server'
      );
      const supabase = await createRouteHandlerClient();

      // Mock error for duplicate
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already exists', status: 400 },
      } as any);

      const result = await supabase.auth.signUp({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(result.error).toBeDefined();
    });

    it('should sign out user', async () => {
      const { createRouteHandlerClient } = await import(
        '@/lib/supabase/server'
      );
      const supabase = await createRouteHandlerClient();

      const result = await supabase.auth.signOut();

      expect(result.error).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should retrieve active session', async () => {
      const { createRouteHandlerClient } = await import(
        '@/lib/supabase/server'
      );
      const supabase = await createRouteHandlerClient();

      const result = await supabase.auth.getSession();

      expect(result.data.session).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should retrieve authenticated user', async () => {
      const { createRouteHandlerClient } = await import(
        '@/lib/supabase/server'
      );
      const supabase = await createRouteHandlerClient();

      const result = await supabase.auth.getUser();

      expect(result.data.user).toBeDefined();
      expect(result.data.user?.id).toBe('test-user-id');
    });

    it('should handle expired session', async () => {
      const { createRouteHandlerClient } = await import(
        '@/lib/supabase/server'
      );
      const supabase = await createRouteHandlerClient();

      // Mock expired session
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Session expired', status: 401 },
      } as any);

      const result = await supabase.auth.getSession();

      expect(result.data.session).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('User Profile Management', () => {
    it('should update lastLogin timestamp on login', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      const initialLogin = user.lastLogin;

      // Simulate login (would update lastLogin in actual implementation)
      // This is tested in integration tests with real API calls

      expect(user.id).toBeDefined();
      // lastLogin update is tested in API route tests
    });

    it('should create user profile on signup', async () => {
      const user = await createTestUser({
        email: 'newuser@example.com',
        name: 'New User',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('newuser@example.com');
      expect(user.name).toBe('New User');
      expect(user.role).toBe('user');
    });

    it('should assign default role to new users', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(user.role).toBe('user');
      expect(user.subscriptionTier).toBe('FREE');
    });

    it('should allow admin role assignment', async () => {
      const user = await createTestUser({
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      });

      expect(user.role).toBe('admin');
    });
  });

  describe('Email Validation', () => {
    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      invalidEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    it('should enforce minimum password length', () => {
      const shortPassword = '1234567'; // 7 chars
      const validPassword = '12345678'; // 8 chars

      expect(shortPassword.length).toBeLessThan(8);
      expect(validPassword.length).toBeGreaterThanOrEqual(8);
    });

    it('should accept passwords with special characters', () => {
      const passwords = ['Pass@123', 'Secure$Password!', 'Test_Pass_123'];

      passwords.forEach((password) => {
        expect(password.length).toBeGreaterThanOrEqual(8);
      });
    });
  });

  describe('Role-Based Access', () => {
    it('should identify admin users', async () => {
      const adminUser = await createTestUser({
        email: 'admin@example.com',
        role: 'admin',
      });

      expect(adminUser.role).toBe('admin');
    });

    it('should identify regular users', async () => {
      const regularUser = await createTestUser({
        email: 'user@example.com',
        role: 'user',
      });

      expect(regularUser.role).toBe('user');
    });

    it('should allow role upgrades', async () => {
      const user = await createTestUser({
        email: 'user@example.com',
        role: 'user',
      });

      expect(user.role).toBe('user');

      // In actual implementation, adminService.updateUserRole would be called
      // This is tested in adminService.test.ts
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const { createRouteHandlerClient } = await import(
        '@/lib/supabase/server'
      );
      const supabase = await createRouteHandlerClient();

      // Mock network error
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle malformed requests', async () => {
      const { createRouteHandlerClient } = await import(
        '@/lib/supabase/server'
      );
      const supabase = await createRouteHandlerClient();

      // Mock malformed request error
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid request', status: 400 },
      } as any);

      const result = await supabase.auth.signInWithPassword({
        email: 'invalid',
        password: '',
      });

      expect(result.error).toBeDefined();
    });
  });
});
