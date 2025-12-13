import { prisma } from '@/lib/db';
import { encryptToken } from './token-encryption';
import { randomUUID } from 'crypto';

/**
 * OAuth account linking service
 * Handles OAuth account creation, linking, and email matching logic
 */
export class OAuthLinkingService {
  /**
   * Find existing account by email
   */
  async findAccountByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });
  }

  /**
   * Create new account from OAuth provider
   * Note: NextAuth.js handles OAuth user creation, we just sync with Prisma
   */
  async createAccountFromOAuth(
    provider: string,
    providerAccountId: string,
    email: string,
    name: string,
    accessToken: string,
    refreshToken?: string,
    image?: string,
    userId?: string
  ) {
    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken
      ? await encryptToken(refreshToken)
      : null;

    // Generate user ID if not provided (NextAuth will provide it)
    const finalUserId = userId || randomUUID();

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id: finalUserId,
        email,
        name,
        avatar: image || null,
        role: 'user',
        accounts: {
          create: {
            type: 'oauth',
            provider,
            providerAccountId,
            access_token: encryptedAccessToken,
            refresh_token: encryptedRefreshToken,
          },
        },
      },
      include: { accounts: true },
    });

    return user;
  }

  /**
   * Link OAuth account to existing user
   */
  async linkAccount(
    userId: string,
    provider: string,
    providerAccountId: string,
    accessToken: string,
    refreshToken?: string
  ) {
    // Check if account already linked
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
    });

    if (existingAccount) {
      // Update existing account with new tokens
      const encryptedAccessToken = await encryptToken(accessToken);
      const encryptedRefreshToken = refreshToken
        ? await encryptToken(refreshToken)
        : null;

      return await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
        },
      });
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken
      ? await encryptToken(refreshToken)
      : null;

    // Create new account link
    return await prisma.account.create({
      data: {
        userId,
        type: 'oauth',
        provider,
        providerAccountId,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
      },
    });
  }

  /**
   * Get user by OAuth provider account
   */
  async getUserByProviderAccount(provider: string, providerAccountId: string) {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: { user: true },
    });

    return account?.user || null;
  }
}

/**
 * Singleton instance
 */
export const oauthLinkingService = new OAuthLinkingService();
