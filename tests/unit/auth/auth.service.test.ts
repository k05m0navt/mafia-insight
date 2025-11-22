import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '@/services/AuthService';

const buildFetchResponse = <T>(data: T, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response);

describe('AuthService', () => {
  let service: AuthService;
  let fetchMock: ReturnType<typeof vi.fn>;

  const clearCookies = () => {
    document.cookie.split(';').forEach((cookie) => {
      const [name] = cookie.split('=');
      if (!name.trim()) return;
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    });
  };

  beforeEach(() => {
    service = new AuthService();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    clearCookies();
  });

  afterEach(() => {
    clearCookies();
    vi.unstubAllGlobals();
  });

  describe('register', () => {
    it('returns error when required fields are missing', async () => {
      const result = await service.register({
        email: '',
        name: '',
        password: '',
      });

      expect(result).toEqual({
        success: false,
        error: 'Name, email, and password are required',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects invalid email format', async () => {
      const result = await service.register({
        email: 'invalid-email',
        name: 'Jane',
        password: 'Password123',
      });

      expect(result).toEqual({
        success: false,
        error: 'Invalid email format',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects passwords shorter than 8 characters', async () => {
      const result = await service.register({
        email: 'jane@example.com',
        name: 'Jane',
        password: 'short',
      });

      expect(result).toEqual({
        success: false,
        error: 'Password must be at least 8 characters long',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('creates user and sets auth cookies on success', async () => {
      fetchMock.mockImplementation(() =>
        buildFetchResponse({
          success: true,
          user: {
            id: 'user-1',
            email: 'jane@example.com',
            name: 'Jane',
            role: 'user',
          },
          token: 'token-abc',
          message: 'Registered',
        })
      );

      const result = await service.register({
        email: 'jane@example.com',
        name: 'Jane',
        password: 'Password123',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/signup',
        expect.any(Object)
      );
      expect(result.success).toBe(true);
      expect(result.user).toMatchObject({
        email: 'jane@example.com',
        name: 'Jane',
      });
      expect(document.cookie).toContain('auth-token=');
      expect(document.cookie).toContain('user-role=');
    });

    it('propagates API errors', async () => {
      fetchMock.mockImplementation(() =>
        buildFetchResponse(
          { success: false, error: 'Registration failed' },
          false,
          400
        )
      );

      const result = await service.register({
        email: 'jane@example.com',
        name: 'Jane',
        password: 'Password123',
      });

      expect(result).toEqual({ success: false, error: 'Registration failed' });
    });
  });

  describe('login', () => {
    it('requires email and password', async () => {
      const result = await service.login({ email: '', password: '' });

      expect(result).toEqual({
        success: false,
        error: 'Email and password are required',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      const result = await service.login({
        email: 'bad-email',
        password: 'Password123',
      });

      expect(result).toEqual({ success: false, error: 'Invalid email format' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns user data on successful login', async () => {
      fetchMock.mockImplementation(() =>
        buildFetchResponse({
          success: true,
          user: {
            id: 'user-1',
            email: 'jane@example.com',
            name: 'Jane',
            role: 'admin',
          },
          token: 'token-xyz',
          message: 'Welcome back',
        })
      );

      const result = await service.login({
        email: 'jane@example.com',
        password: 'Password123',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.any(Object)
      );
      expect(result.success).toBe(true);
      expect(result.user).toMatchObject({ role: 'admin' });
      expect(document.cookie).toContain('auth-token=');
    });

    it('returns API error responses when login fails', async () => {
      fetchMock.mockImplementation(() =>
        buildFetchResponse(
          { success: false, error: 'Invalid credentials' },
          false,
          401
        )
      );

      const result = await service.login({
        email: 'jane@example.com',
        password: 'wrong',
      });

      expect(result).toEqual({ success: false, error: 'Invalid credentials' });
    });
  });

  describe('validateToken', () => {
    it('rejects empty tokens', async () => {
      const result = await service.validateToken('');

      expect(result).toEqual({ success: false, error: 'Token is required' });
    });

    it('returns mocked user for any non-empty token', async () => {
      const result = await service.validateToken('token');

      expect(result.success).toBe(true);
      expect(result.user).toMatchObject({ email: 'test@example.com' });
    });
  });

  describe('resetPassword', () => {
    it('sends reset email when provided with email string', async () => {
      const result = await service.resetPassword('user@example.com');

      expect(result).toEqual({
        success: true,
        message: 'Password reset email sent',
      });
    });

    it('validates token payload when resetting directly', async () => {
      const missingToken = await service.resetPassword({
        token: '',
        newPassword: 'Password123',
      });
      expect(missingToken).toEqual({
        success: false,
        error: 'Token is required',
      });

      const invalidToken = await service.resetPassword({
        token: 'invalid-token',
        newPassword: 'Password123',
      });
      expect(invalidToken).toEqual({
        success: false,
        error: 'Invalid or expired reset token',
      });

      const success = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'Password123',
      });
      expect(success).toEqual({
        success: true,
        message: 'Password reset successfully',
      });
    });
  });

  describe('refreshToken', () => {
    it('returns failure when unauthenticated', () => {
      clearCookies();
      const result = service.refreshToken();
      expect(result).toEqual({ success: false });
    });

    it('returns refreshed token when authenticated', () => {
      // @ts-expect-error accessing private field for test purposes
      service.token = 'existing-token';
      const result = service.refreshToken();

      expect(result.success).toBe(true);
      expect(result.token).toMatch(/^refreshed-token-/);
    });
  });

  describe('getPermissions', () => {
    it('returns empty permissions when user not set', async () => {
      const permissions = await service.getPermissions();
      expect(permissions).toEqual([]);
    });

    it('returns role-based permissions', async () => {
      // @ts-expect-error accessing private field for test purposes
      service.user = {
        id: 'user-1',
        email: 'jane@example.com',
        name: 'Jane',
        role: 'moderator',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const permissions = await service.getPermissions();
      expect(permissions).toContain('moderate:content');
    });
  });
});
