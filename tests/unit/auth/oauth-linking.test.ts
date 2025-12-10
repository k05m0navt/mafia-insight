import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OAuthLinkingService } from '@/lib/auth/oauth-linking';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types/auth';
import * as tokenEncryption from '@/lib/auth/token-encryption';

// Mock dependencies
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
  },
}));

vi.mock('@/lib/auth/token-encryption', () => ({
  encryptToken: vi.fn(),
  decryptToken: vi.fn(),
}));

describe('OAuthLinkingService', () => {
  let service: OAuthLinkingService;

  beforeEach(() => {
    service = new OAuthLinkingService();
    vi.clearAllMocks();
  });

  describe('findAccountByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        accounts: [],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await service.findAccountByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { accounts: true },
      });
    });

    it('should return null if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await service.findAccountByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createAccountFromOAuth', () => {
    it('should create new user account from OAuth', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'newuser@example.com',
        name: 'New User',
        avatar: 'https://example.com/avatar.jpg',
        role: UserRole.user,
        accounts: [
          {
            id: 'account-1',
            provider: 'google',
            providerAccountId: 'google-123',
          },
        ],
      };

      vi.mocked(tokenEncryption.encryptToken).mockResolvedValue(
        'encrypted-token'
      );
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const result = await service.createAccountFromOAuth(
        'google',
        'google-123',
        'newuser@example.com',
        'New User',
        'access-token',
        'refresh-token',
        'https://example.com/avatar.jpg',
        'user-1'
      );

      expect(result).toEqual(mockUser);
      expect(tokenEncryption.encryptToken).toHaveBeenCalledWith('access-token');
      expect(tokenEncryption.encryptToken).toHaveBeenCalledWith(
        'refresh-token'
      );
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          id: 'user-1',
          email: 'newuser@example.com',
          name: 'New User',
          avatar: 'https://example.com/avatar.jpg',
          role: UserRole.user,
          accounts: {
            create: {
              type: 'oauth',
              provider: 'google',
              providerAccountId: 'google-123',
              access_token: 'encrypted-token',
              refresh_token: 'encrypted-token',
            },
          },
        },
        include: { accounts: true },
      });
    });

    it('should handle missing refresh token', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'newuser@example.com',
        name: 'New User',
        accounts: [],
      };

      vi.mocked(tokenEncryption.encryptToken).mockResolvedValue(
        'encrypted-token'
      );
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      await service.createAccountFromOAuth(
        'google',
        'google-123',
        'newuser@example.com',
        'New User',
        'access-token',
        undefined,
        undefined,
        'user-1'
      );

      expect(tokenEncryption.encryptToken).toHaveBeenCalledWith('access-token');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accounts: {
              create: expect.objectContaining({
                refresh_token: null,
              }),
            },
          }),
        })
      );
    });
  });

  describe('linkAccount', () => {
    it('should link OAuth account to existing user', async () => {
      const mockAccount = {
        id: 'account-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-123',
        access_token: 'encrypted-token',
        refresh_token: 'encrypted-refresh',
      };

      vi.mocked(prisma.account.findUnique).mockResolvedValue(null);
      vi.mocked(tokenEncryption.encryptToken).mockResolvedValue(
        'encrypted-token'
      );
      vi.mocked(prisma.account.create).mockResolvedValue(mockAccount as any);

      const result = await service.linkAccount(
        'user-1',
        'google',
        'google-123',
        'access-token',
        'refresh-token'
      );

      expect(result).toEqual(mockAccount);
      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: 'google-123',
          },
        },
      });
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'oauth',
          provider: 'google',
          providerAccountId: 'google-123',
          access_token: 'encrypted-token',
          refresh_token: 'encrypted-token',
        },
      });
    });

    it('should update existing account if already linked', async () => {
      const existingAccount = {
        id: 'account-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-123',
      };

      const updatedAccount = {
        ...existingAccount,
        access_token: 'new-encrypted-token',
        refresh_token: 'new-encrypted-refresh',
      };

      vi.mocked(prisma.account.findUnique).mockResolvedValue(
        existingAccount as any
      );
      vi.mocked(tokenEncryption.encryptToken).mockResolvedValue(
        'new-encrypted-token'
      );
      vi.mocked(prisma.account.update).mockResolvedValue(updatedAccount as any);

      const result = await service.linkAccount(
        'user-1',
        'google',
        'google-123',
        'new-access-token',
        'new-refresh-token'
      );

      expect(result).toEqual(updatedAccount);
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: {
          access_token: 'new-encrypted-token',
          refresh_token: 'new-encrypted-token',
        },
      });
    });
  });

  describe('getUserByProviderAccount', () => {
    it('should get user by provider account', async () => {
      const mockAccount = {
        id: 'account-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-123',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      vi.mocked(prisma.account.findUnique).mockResolvedValue(
        mockAccount as any
      );

      const result = await service.getUserByProviderAccount(
        'google',
        'google-123'
      );

      expect(result).toEqual(mockAccount.user);
      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: 'google-123',
          },
        },
        include: { user: true },
      });
    });

    it('should return null if account not found', async () => {
      vi.mocked(prisma.account.findUnique).mockResolvedValue(null);

      const result = await service.getUserByProviderAccount(
        'google',
        'not-found'
      );

      expect(result).toBeNull();
    });
  });
});
