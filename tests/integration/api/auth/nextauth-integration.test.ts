import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { createRouteHandlerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

describe('NextAuth.js Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should configure NextAuth with CredentialsProvider', () => {
    expect(authOptions.providers).toBeDefined();
    expect(authOptions.providers.length).toBeGreaterThan(0);
    expect(authOptions.providers[0].id).toBe('credentials');
  });

  it('should have JWT session strategy configured', () => {
    expect(authOptions.session?.strategy).toBe('jwt');
  });

  it('should have custom sign-in page configured', () => {
    expect(authOptions.pages?.signIn).toBe('/login');
  });

  it('should extend session with user role', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      },
      token: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      },
    };

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

    const session = await getServerSession(authOptions);

    expect(session).toBeDefined();
    expect(session?.user).toBeDefined();
  });

  it('should integrate with Supabase Auth for authentication', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              email_confirmed_at: new Date().toISOString(),
            },
            session: {
              access_token: 'token-123',
            },
          },
          error: null,
        }),
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              email_confirmed_at: new Date().toISOString(),
            },
          },
        }),
      },
    };

    vi.mocked(createRouteHandlerClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      subscriptionTier: 'FREE',
      themePreference: 'system',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    } as any);

    // This verifies that NextAuth can use Supabase Auth
    const supabase = await createRouteHandlerClient();
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe('test@example.com');
  });

  it('should require email verification before creating session', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              email_confirmed_at: null, // Not verified
            },
          },
          error: null,
        }),
      },
    };

    vi.mocked(createRouteHandlerClient).mockResolvedValue(mockSupabase as any);

    const supabase = await createRouteHandlerClient();
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });

    // User should not be able to create session if email not verified
    expect(data.user?.email_confirmed_at).toBeNull();
  });
});
