import { prisma } from '@/lib/db';
import { decryptToken, encryptToken } from './token-encryption';

/**
 * OAuth token refresh service
 * Handles refreshing OAuth provider access tokens using refresh tokens
 */
export class OAuthTokenRefreshService {
  /**
   * Refresh OAuth access token for a provider
   * @param provider - OAuth provider (google, github)
   * @param refreshToken - Encrypted refresh token
   * @returns New access token and refresh token (if rotated)
   */
  async refreshAccessToken(
    provider: string,
    refreshToken: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    // Decrypt refresh token
    const decryptedRefreshToken = await decryptToken(refreshToken);

    try {
      if (provider === 'google') {
        return await this.refreshGoogleToken(decryptedRefreshToken);
      } else if (provider === 'github') {
        // GitHub doesn't support refresh tokens in the same way
        // Users need to re-authenticate when token expires
        throw new Error('GitHub does not support refresh tokens');
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`[OAuth] Token refresh failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Refresh Google OAuth token
   */
  private async refreshGoogleToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Google token refresh failed: ${errorData.error || response.statusText}`
      );
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token, // Google may return new refresh token
      expiresAt: data.expires_in
        ? Math.floor(Date.now() / 1000) + data.expires_in
        : undefined,
    };
  }

  /**
   * Update account tokens in database after refresh
   */
  async updateAccountTokens(
    accountId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: number
  ): Promise<void> {
    const encryptedAccessToken = await encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken
      ? await encryptToken(refreshToken)
      : undefined;

    await prisma.account.update({
      where: { id: accountId },
      data: {
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken || undefined,
        expires_at: expiresAt,
      },
    });
  }

  /**
   * Check if token needs refresh (expires within 5 minutes)
   */
  needsRefresh(expiresAt?: number | null): boolean {
    if (!expiresAt) return false;
    // Refresh if token expires within 5 minutes
    const fiveMinutesFromNow = Math.floor(Date.now() / 1000) + 5 * 60;
    return expiresAt <= fiveMinutesFromNow;
  }
}

/**
 * Singleton instance
 */
export const oauthTokenRefreshService = new OAuthTokenRefreshService();
