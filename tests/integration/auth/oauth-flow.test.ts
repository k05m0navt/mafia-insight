import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OAuthLinkingService } from '@/lib/auth/oauth-linking';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types/auth';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    securityEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/token-encryption', () => ({
  encryptToken: vi.fn((token) => Promise.resolve(`encrypted-${token}`)),
  decryptToken: vi.fn((encrypted) =>
    Promise.resolve(encrypted.replace('encrypted-', ''))
  ),
}));

describe('OAuth Flow Integration', () => {
  let oauthService: OAuthLinkingService;

  beforeEach(() => {
    oauthService = new OAuthLinkingService();
    vi.clearAllMocks();
  });

  describe('New User OAuth Sign-In', () => {
    it('should create new user and account when email does not exist', async () => {
      // User doesn't exist
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.account.findUnique).mockResolvedValue(null);

      const newUser = {
        id: 'user-1',
        email: 'newuser@example.com',
        name: 'New User',
        role: UserRole.user,
        accounts: [
          {
            id: 'account-1',
            provider: 'google',
            providerAccountId: 'google-123',
          },
        ],
      };

      vi.mocked(prisma.user.create).mockResolvedValue(newUser as any);

      const result = await oauthService.createAccountFromOAuth(
        'google',
        'google-123',
        'newuser@example.com',
        'New User',
        'access-token',
        'refresh-token',
        'https://example.com/avatar.jpg',
        'user-1'
      );

      expect(result).toEqual(newUser);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'newuser@example.com',
            name: 'New User',
            role: UserRole.user,
            accounts: {
              create: expect.objectContaining({
                provider: 'google',
                providerAccountId: 'google-123',
              }),
            },
          }),
        })
      );
    });
  });

  describe('Existing User OAuth Linking', () => {
    it('should link OAuth account to existing user by email', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'existing@example.com',
        name: 'Existing User',
        accounts: [],
      };

      // User exists but no OAuth account
      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);
      vi.mocked(prisma.account.findUnique).mockResolvedValue(null);

      const linkedAccount = {
        id: 'account-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-123',
      };

      vi.mocked(prisma.account.create).mockResolvedValue(linkedAccount as any);

      const result = await oauthService.linkAccount(
        'user-1',
        'google',
        'google-123',
        'access-token',
        'refresh-token'
      );

      expect(result).toEqual(linkedAccount);
      expect(prisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            provider: 'google',
            providerAccountId: 'google-123',
          }),
        })
      );
    });

    it('should update existing OAuth account if already linked', async () => {
      const existingAccount = {
        id: 'account-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-123',
        access_token: 'old-encrypted-token',
      };

      vi.mocked(prisma.account.findUnique).mockResolvedValue(
        existingAccount as any
      );

      const updatedAccount = {
        ...existingAccount,
        access_token: 'new-encrypted-token',
        refresh_token: 'new-encrypted-refresh',
      };

      vi.mocked(prisma.account.update).mockResolvedValue(updatedAccount as any);

      const result = await oauthService.linkAccount(
        'user-1',
        'google',
        'google-123',
        'new-access-token',
        'new-refresh-token'
      );

      expect(result).toEqual(updatedAccount);
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: expect.objectContaining({
          access_token: 'encrypted-new-access-token',
          refresh_token: 'encrypted-new-refresh-token',
        }),
      });
    });
  });

  describe('Multiple OAuth Providers', () => {
    it('should support linking multiple providers to same user', async () => {
      const user = {
        id: 'user-1',
        email: 'user@example.com',
        accounts: [
          {
            id: 'account-1',
            provider: 'google',
            providerAccountId: 'google-123',
          },
        ],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
      vi.mocked(prisma.account.findUnique).mockResolvedValue(null);

      const githubAccount = {
        id: 'account-2',
        userId: 'user-1',
        provider: 'github',
        providerAccountId: 'github-456',
      };

      vi.mocked(prisma.account.create).mockResolvedValue(githubAccount as any);

      // Link GitHub account to user who already has Google
      const result = await oauthService.linkAccount(
        'user-1',
        'github',
        'github-456',
        'github-access-token',
        'github-refresh-token'
      );

      expect(result).toEqual(githubAccount);
      expect(prisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            provider: 'github',
            providerAccountId: 'github-456',
          }),
        })
      );
    });
  });

  describe('Token Encryption Integration', () => {
    it('should encrypt tokens before storing in database', async () => {
      vi.mocked(prisma.account.findUnique).mockResolvedValue(null);

      const account = {
        id: 'account-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-123',
        access_token: 'encrypted-access-token',
        refresh_token: 'encrypted-refresh-token',
      };

      vi.mocked(prisma.account.create).mockResolvedValue(account as any);

      await oauthService.linkAccount(
        'user-1',
        'google',
        'google-123',
        'access-token',
        'refresh-token'
      );

      expect(prisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            access_token: 'encrypted-access-token',
            refresh_token: 'encrypted-refresh-token',
          }),
        })
      );
    });
  });
});
