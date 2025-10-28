import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  authService,
  validateEmail,
  validatePassword,
  validateSignupCredentials,
  validateLoginCredentials,
} from '@/lib/auth';

// Mock fetch
global.fetch = vi.fn();

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'user@example.com',
          role: 'user',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'token123',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.login({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
      expect(authService.getToken()).toBe('token123');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should throw error for invalid credentials', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          }),
      } as Response);

      await expect(
        authService.login({
          email: 'user@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should store token in localStorage', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'user@example.com',
          role: 'user',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'token123',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await authService.login({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(localStorage.getItem('auth_token')).toBe('token123');
    });
  });

  describe('signup', () => {
    it('should signup successfully with valid credentials', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'user@example.com',
          role: 'user',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'token123',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.signup({
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(result).toEqual(mockResponse);
      expect(authService.getToken()).toBe('token123');
    });

    it('should throw error for existing email', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            message: 'Email already exists',
            code: 'EMAIL_EXISTS',
          }),
      } as Response);

      await expect(
        authService.signup({
          email: 'user@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Set initial token
      authService['token'] = 'token123';
      localStorage.setItem('auth_token', 'token123');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Logged out successfully' }),
      } as Response);

      await authService.logout();

      expect(authService.getToken()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should clear token even if API call fails', async () => {
      // Set initial token
      authService['token'] = 'token123';
      localStorage.setItem('auth_token', 'token123');

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await authService.logout();

      expect(authService.getToken()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        role: 'user',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      } as Response);

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });
  });

  describe('getPermissions', () => {
    it('should return user permissions', async () => {
      const mockPermissions = ['read:players', 'read:analytics'];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ permissions: mockPermissions }),
      } as Response);

      const result = await authService.getPermissions();

      expect(result).toEqual(mockPermissions);
    });
  });
});

describe('Validation Functions', () => {
  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return valid for strong password', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for weak password', () => {
      const result = validatePassword('123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      );
    });

    it('should return invalid for password without uppercase', () => {
      const result = validatePassword('password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should return invalid for password without lowercase', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should return invalid for password without number', () => {
      const result = validatePassword('Password');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
    });
  });

  describe('validateSignupCredentials', () => {
    it('should return valid for correct credentials', () => {
      const result = validateSignupCredentials({
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return invalid for mismatched passwords', () => {
      const result = validateSignupCredentials({
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPassword123',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.confirmPassword).toBe('Passwords do not match');
    });

    it('should return invalid for empty fields', () => {
      const result = validateSignupCredentials({
        email: '',
        password: '',
        confirmPassword: '',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email is required');
      expect(result.errors.password).toBe('Password is required');
      expect(result.errors.confirmPassword).toBe(
        'Confirm password is required'
      );
    });
  });

  describe('validateLoginCredentials', () => {
    it('should return valid for correct credentials', () => {
      const result = validateLoginCredentials({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return invalid for empty fields', () => {
      const result = validateLoginCredentials({
        email: '',
        password: '',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email is required');
      expect(result.errors.password).toBe('Password is required');
    });
  });
});
