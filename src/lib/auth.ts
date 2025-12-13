import {
  User,
  LoginCredentials,
  SignupCredentials,
  AuthResponse,
  UserRole,
} from '@/types/auth';
import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Session, User as NextAuthUser } from 'next-auth';
import { AdapterUser } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { AuthenticationError } from './errors';
import { createRouteHandlerClient } from '@/lib/supabase/server';

// Extend NextAuth types to include role
declare module 'next-auth' {
  interface User {
    role?: UserRole;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: UserRole;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    email?: string;
    role?: UserRole;
    provider?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    accountId?: string;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/auth';

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AuthenticationError(
        errorData.message || 'Authentication failed'
      );
    }

    return response.json();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      this.token = response.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
      }

      return response;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Login failed');
    }
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>('/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      this.token = response.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
      }

      return response;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Signup failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.makeRequest<User>('/me');
  }

  async getPermissions(): Promise<string[]> {
    const response = await this.makeRequest<{ permissions: string[] }>(
      '/permissions'
    );
    return response.permissions;
  }

  async refreshToken(): Promise<{
    success: boolean;
    token?: string;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        token?: string;
        expiresAt?: string;
        message?: string;
      }>('/refresh', {
        method: 'POST',
      });

      if (response.success && response.token) {
        this.token = response.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', response.token);
        }

        return {
          success: true,
          token: response.token,
          expiresAt: response.expiresAt
            ? new Date(response.expiresAt)
            : undefined,
        };
      }

      return {
        success: false,
        error: 'Token refresh failed',
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'Token refresh failed',
      };
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const authService = AuthService.getInstance();

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use Supabase Auth for authentication
          const supabase = await createRouteHandlerClient();

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            return null;
          }

          // Check if email is verified
          if (!data.user.email_confirmed_at) {
            throw new Error('Email not verified');
          }

          // Get user profile from database
          const { prisma } = await import('@/lib/db');
          const userProfile = await prisma.user.findUnique({
            where: { id: data.user.id },
          });

          if (!userProfile) {
            return null;
          }

          // Return user object for NextAuth session
          return {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            role: userProfile.role,
            image: userProfile.avatar || undefined,
          };
        } catch (error) {
          console.error('[NextAuth] Authorization error:', error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          // Request minimum necessary permissions per AC #1:
          // - openid: Required for OpenID Connect authentication
          // - email: Required to identify user and link accounts
          // - profile: Required for user name and avatar
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline', // Required to receive refresh token
        },
      },
    }),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authorization: {
              params: {
                // Request minimum necessary permissions per AC #1:
                // - user:email: Required to identify user and link accounts
                // Note: GitHub doesn't provide refresh tokens, users need to re-authenticate
                scope: 'user:email',
              },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const { oauthLinkingService } = await import('./auth/oauth-linking');
          const { prisma } = await import('@/lib/db');

          const email = user.email || profile?.email || '';
          if (!email) {
            console.error('[NextAuth] OAuth: No email provided');
            return false;
          }

          // Check if account already exists for this provider
          const existingAccount =
            await oauthLinkingService.getUserByProviderAccount(
              account.provider,
              account.providerAccountId
            );

          if (existingAccount) {
            // Account already linked, update user object
            user.id = existingAccount.id;
            return true;
          }

          // Check if user exists by email
          const existingUser =
            await oauthLinkingService.findAccountByEmail(email);

          if (existingUser) {
            // Link OAuth account to existing user
            await oauthLinkingService.linkAccount(
              existingUser.id,
              account.provider,
              account.providerAccountId,
              account.access_token || '',
              account.refresh_token || undefined
            );
            user.id = existingUser.id;
            return true;
          }

          // Create new account from OAuth
          // NextAuth provides user.id, so we use it
          const newUser = await oauthLinkingService.createAccountFromOAuth(
            account.provider,
            account.providerAccountId,
            email,
            user.name || profile?.name || email.split('@')[0],
            account.access_token || '',
            account.refresh_token || undefined,
            user.image ||
              (profile as any)?.picture ||
              (profile as any)?.avatar_url,
            user.id // Use NextAuth's user ID
          );
          user.id = newUser.id;

          // Log OAuth authentication event
          await prisma.securityEvent.create({
            data: {
              eventType: 'OAUTH_SIGNIN_SUCCESS',
              userId: newUser.id,
              email: newUser.email,
              ipAddress: 'unknown', // Will be set by middleware if available
              details: {
                provider: account.provider,
                method: 'oauth',
              },
            },
          });

          return true;
        } catch (error) {
          console.error('[NextAuth] OAuth sign-in error:', error);

          // Log OAuth error with enhanced details
          const { prisma } = await import('@/lib/db');

          // Extract provider-specific error details
          const errorDetails: Record<string, any> = {
            provider: account?.provider,
            error: error instanceof Error ? error.message : 'Unknown error',
          };

          // Add provider-specific error codes if available
          if (error instanceof Error && error.message) {
            // Google OAuth errors
            if (account?.provider === 'google') {
              if (error.message.includes('access_denied')) {
                errorDetails.errorCode = 'OAUTH_ACCESS_DENIED';
                errorDetails.errorType = 'user_denied';
              } else if (error.message.includes('invalid_grant')) {
                errorDetails.errorCode = 'OAUTH_INVALID_GRANT';
                errorDetails.errorType = 'token_expired';
              } else if (error.message.includes('invalid_client')) {
                errorDetails.errorCode = 'OAUTH_INVALID_CLIENT';
                errorDetails.errorType = 'configuration_error';
              }
            }

            // GitHub OAuth errors
            if (account?.provider === 'github') {
              if (error.message.includes('access_denied')) {
                errorDetails.errorCode = 'OAUTH_ACCESS_DENIED';
                errorDetails.errorType = 'user_denied';
              } else if (error.message.includes('bad_verification_code')) {
                errorDetails.errorCode = 'OAUTH_BAD_VERIFICATION_CODE';
                errorDetails.errorType = 'verification_error';
              }
            }

            // Classify error as transient or permanent
            const transientErrors = ['network_error', 'timeout', 'rate_limit'];
            errorDetails.isTransient = transientErrors.some((e) =>
              error.message.toLowerCase().includes(e)
            );
          }

          await prisma.securityEvent.create({
            data: {
              eventType: 'OAUTH_SIGNIN_ERROR',
              email: user.email || undefined,
              ipAddress: 'unknown',
              details: errorDetails,
            },
          });

          return false;
        }
      }

      // Allow credentials provider sign-in
      return true;
    },
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT;
      user: NextAuthUser | AdapterUser;
      account?: any;
    }) {
      // Initial sign-in: store user data and account info
      if (user) {
        token.id = user.id;
        token.email = user.email || undefined;
        token.role = (user as any).role || 'user';
        token.name = user.name || undefined;

        // Store OAuth provider info in token
        if (account?.provider) {
          token.provider = account.provider;
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.expiresAt = account.expires_at;

          // Look up account ID from database using provider and providerAccountId
          const { prisma } = await import('@/lib/db');
          const accountRecord = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });
          if (accountRecord) {
            token.accountId = accountRecord.id;
          }
        }
      }

      // Token refresh: check if OAuth token needs refresh
      if (token.provider && token.accountId && token.expiresAt) {
        const { oauthTokenRefreshService } = await import(
          './auth/oauth-token-refresh'
        );
        const { prisma } = await import('@/lib/db');

        // Check if token needs refresh (expires within 5 minutes)
        if (oauthTokenRefreshService.needsRefresh(token.expiresAt)) {
          try {
            // Get account from database
            const accountRecord = await prisma.account.findUnique({
              where: { id: token.accountId as string },
            });

            if (accountRecord?.refresh_token) {
              // Refresh the token
              const refreshed =
                await oauthTokenRefreshService.refreshAccessToken(
                  token.provider as string,
                  accountRecord.refresh_token
                );

              // Update account in database
              await oauthTokenRefreshService.updateAccountTokens(
                token.accountId as string,
                refreshed.accessToken,
                refreshed.refreshToken,
                refreshed.expiresAt
              );

              // Update token with new expiration
              token.expiresAt = refreshed.expiresAt;
              token.accessToken = refreshed.accessToken;

              // Log token refresh event
              await prisma.securityEvent.create({
                data: {
                  eventType: 'OAUTH_TOKEN_REFRESHED',
                  userId: token.id as string,
                  email: token.email || undefined,
                  ipAddress: 'unknown',
                  details: {
                    provider: token.provider,
                  },
                },
              });
            }
          } catch (error) {
            console.error('[NextAuth] Token refresh error:', error);
            // If refresh fails, token will expire and user will need to re-authenticate
            // Don't throw - let the session continue until it expires
          }
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email || '';
        session.user.role = token.role as UserRole;
        session.user.name = token.name || null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days for JWT token
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days for JWT
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateSignupCredentials = (
  credentials: SignupCredentials
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!credentials.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(credentials.email)) {
    errors.email = 'Invalid email format';
  }

  if (!credentials.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(credentials.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
  }

  if (!credentials.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (credentials.password !== credentials.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateLoginCredentials = (
  credentials: LoginCredentials
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!credentials.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(credentials.email)) {
    errors.email = 'Invalid email format';
  }

  if (!credentials.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
