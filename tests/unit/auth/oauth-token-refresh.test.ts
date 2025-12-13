import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OAuthTokenRefreshService } from '@/lib/auth/oauth-token-refresh';
import { prisma } from '@/lib/db';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    account: {
      update: vi.fn(),
    },
  },
}));

// Mock token encryption
vi.mock('@/lib/auth/token-encryption', () => ({
  encryptToken: vi.fn((token) => Promise.resolve(`encrypted-${token}`)),
  decryptToken: vi.fn((encrypted) =>
    Promise.resolve(encrypted.replace('encrypted-', ''))
  ),
}));

// Mock fetch for OAuth token refresh
global.fetch = vi.fn();

describe('OAuthTokenRefreshService', () => {
  let service: OAuthTokenRefreshService;

  beforeEach(() => {
    service = new OAuthTokenRefreshService();
    vi.clearAllMocks();
  });

  describe('needsRefresh', () => {
    it('should return false if expiresAt is not provided', () => {
      expect(service.needsRefresh(undefined)).toBe(false);
      expect(service.needsRefresh(null)).toBe(false);
    });

    it('should return false if token expires more than 5 minutes from now', () => {
      const fiveMinutesFromNow = Math.floor(Date.now() / 1000) + 6 * 60; // 6 minutes
      expect(service.needsRefresh(fiveMinutesFromNow)).toBe(false);
    });

    it('should return true if token expires within 5 minutes', () => {
      const fourMinutesFromNow = Math.floor(Date.now() / 1000) + 4 * 60; // 4 minutes
      expect(service.needsRefresh(fourMinutesFromNow)).toBe(true);
    });

    it('should return true if token is already expired', () => {
      const expired = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
      expect(service.needsRefresh(expired)).toBe(true);
    });
  });

  describe('refreshGoogleToken', () => {
    it('should refresh Google OAuth token successfully', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.refreshAccessToken(
        'google',
        'encrypted-refresh-token'
      );

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.expiresAt).toBeDefined();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });

    it('should throw error if Google token refresh fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ error: 'invalid_grant' }),
      } as Response);

      await expect(
        service.refreshAccessToken('google', 'encrypted-refresh-token')
      ).rejects.toThrow('Google token refresh failed');
    });
  });

  describe('refreshGitHubToken', () => {
    it('should throw error for GitHub (no refresh token support)', async () => {
      await expect(
        service.refreshAccessToken('github', 'encrypted-refresh-token')
      ).rejects.toThrow('GitHub does not support refresh tokens');
    });
  });

  describe('updateAccountTokens', () => {
    it('should update account tokens in database', async () => {
      const updatedAccount = {
        id: 'account-1',
        access_token: 'encrypted-new-access-token',
        refresh_token: 'encrypted-new-refresh-token',
        expires_at: 1234567890,
      };

      vi.mocked(prisma.account.update).mockResolvedValue(updatedAccount as any);

      await service.updateAccountTokens(
        'account-1',
        'new-access-token',
        'new-refresh-token',
        1234567890
      );

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: {
          access_token: 'encrypted-new-access-token',
          refresh_token: 'encrypted-new-refresh-token',
          expires_at: 1234567890,
        },
      });
    });

    it('should update account without refresh token if not provided', async () => {
      const updatedAccount = {
        id: 'account-1',
        access_token: 'encrypted-new-access-token',
        expires_at: 1234567890,
      };

      vi.mocked(prisma.account.update).mockResolvedValue(updatedAccount as any);

      await service.updateAccountTokens(
        'account-1',
        'new-access-token',
        undefined,
        1234567890
      );

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: {
          access_token: 'encrypted-new-access-token',
          refresh_token: undefined,
          expires_at: 1234567890,
        },
      });
    });
  });
});
