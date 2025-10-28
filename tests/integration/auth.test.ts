import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { authService } from '@/services/authService';
import { AuthContext } from '@/lib/auth/AuthContext';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Login Flow', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        role: 'user',
      };

      const mockAuthResponse = {
        data: { user: mockUser },
        error: null,
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        mockAuthResponse
      );

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual({
        success: true,
        user: mockUser,
        error: null,
      });

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle authentication failure with invalid credentials', async () => {
      const mockError = {
        message: 'Invalid login credentials',
        status: 400,
      };

      const mockAuthResponse = {
        data: { user: null },
        error: mockError,
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        mockAuthResponse
      );

      const result = await authService.login(
        'invalid@example.com',
        'wrongpassword'
      );

      expect(result).toEqual({
        success: false,
        user: null,
        error: 'Invalid login credentials',
      });
    });

    it('should handle network errors during authentication', async () => {
      const networkError = new Error('Network error');
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        networkError
      );

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual({
        success: false,
        user: null,
        error: 'Authentication failed. Please try again.',
      });
    });
  });

  describe('Signup Flow', () => {
    it('should successfully create new user account', async () => {
      const mockUser = {
        id: 'user_456',
        email: 'newuser@example.com',
        role: 'user',
      };

      const mockAuthResponse = {
        data: { user: mockUser },
        error: null,
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue(mockAuthResponse);

      const result = await authService.signup(
        'newuser@example.com',
        'password123',
        'password123'
      );

      expect(result).toEqual({
        success: true,
        user: mockUser,
        error: null,
      });

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });
    });

    it('should handle password mismatch during signup', async () => {
      const result = await authService.signup(
        'test@example.com',
        'password123',
        'differentpassword'
      );

      expect(result).toEqual({
        success: false,
        user: null,
        error: 'Passwords do not match',
      });

      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
    });

    it('should handle weak password during signup', async () => {
      const mockError = {
        message: 'Password should be at least 8 characters',
        status: 400,
      };

      const mockAuthResponse = {
        data: { user: null },
        error: mockError,
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue(mockAuthResponse);

      const result = await authService.signup('test@example.com', '123', '123');

      expect(result).toEqual({
        success: false,
        user: null,
        error: 'Password should be at least 8 characters',
      });
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout authenticated user', async () => {
      const mockAuthResponse = {
        data: {},
        error: null,
      };

      mockSupabaseClient.auth.signOut.mockResolvedValue(mockAuthResponse);

      const result = await authService.logout();

      expect(result).toEqual({
        success: true,
        error: null,
      });

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const mockError = {
        message: 'Logout failed',
        status: 500,
      };

      const mockAuthResponse = {
        data: {},
        error: mockError,
      };

      mockSupabaseClient.auth.signOut.mockResolvedValue(mockAuthResponse);

      const result = await authService.logout();

      expect(result).toEqual({
        success: false,
        error: 'Logout failed',
      });
    });
  });

  describe('Authentication State Management', () => {
    it('should maintain authentication state across page refreshes', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        role: 'user',
      };

      const mockAuthResponse = {
        data: { user: mockUser },
        error: null,
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthResponse);

      const result = await authService.getCurrentUser();

      expect(result).toEqual({
        success: true,
        user: mockUser,
        error: null,
      });

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
    });

    it('should handle unauthenticated state', async () => {
      const mockAuthResponse = {
        data: { user: null },
        error: null,
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthResponse);

      const result = await authService.getCurrentUser();

      expect(result).toEqual({
        success: true,
        user: null,
        error: null,
      });
    });
  });

  describe('Error Handling', () => {
    it('should provide user-friendly error messages for common authentication errors', async () => {
      const testCases = [
        {
          error: { message: 'Invalid login credentials', status: 400 },
          expectedMessage:
            'Invalid email or password. Please check your credentials and try again.',
        },
        {
          error: { message: 'Email not confirmed', status: 400 },
          expectedMessage:
            'Please check your email and click the confirmation link before signing in.',
        },
        {
          error: { message: 'Too many requests', status: 429 },
          expectedMessage:
            'Too many login attempts. Please wait a few minutes before trying again.',
        },
        {
          error: { message: 'Network error', status: 0 },
          expectedMessage:
            'Unable to connect to the server. Please check your internet connection.',
        },
      ];

      for (const testCase of testCases) {
        const mockAuthResponse = {
          data: { user: null },
          error: testCase.error,
        };

        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
          mockAuthResponse
        );

        const result = await authService.login(
          'test@example.com',
          'password123'
        );

        expect(result.error).toBe(testCase.expectedMessage);
      }
    });
  });
});
