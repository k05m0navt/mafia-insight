import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/signup/route';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock cookie utilities
vi.mock('@/lib/utils/apiAuth', () => ({
  setAuthTokenCookie: vi.fn(),
  setUserRoleCookie: vi.fn(),
}));

import { createRouteHandlerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

describe('POST /api/auth/signup', () => {
  const mockSupabase = {
    auth: {
      signUp: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createRouteHandlerClient).mockResolvedValue(mockSupabase as any);
  });

  const validRegistrationData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'StrongP@ss1',
    confirmPassword: 'StrongP@ss1',
  };

  it('should successfully create a new user account', async () => {
    // Mock: No existing user
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    // Mock: Supabase auth signup success
    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'john.doe@example.com',
        },
        session: {
          access_token: 'token-123',
          expires_at: Math.floor(Date.now() / 1000) + 86400,
        },
      },
      error: null,
    });

    // Mock: Prisma user creation success
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-123',
      email: 'john.doe@example.com',
      name: 'John Doe',
      role: 'user',
      subscriptionTier: 'FREE',
      themePreference: 'system',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(validRegistrationData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('john.doe@example.com');
    expect(data.user.name).toBe('John Doe');
    expect(data.user.role).toBe('user');
    expect(data.message).toContain('Account created successfully');
  });

  it('should reject duplicate email addresses', async () => {
    // Mock: User already exists
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'existing-user',
      email: 'john.doe@example.com',
      name: 'Existing User',
      role: 'user',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(validRegistrationData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toContain('already exists');
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('should validate email format (RFC 5322)', async () => {
    const invalidEmailData = {
      ...validRegistrationData,
      email: 'invalid-email',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(invalidEmailData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('should validate password requirements', async () => {
    const weakPasswordData = {
      ...validRegistrationData,
      password: 'weak',
      confirmPassword: 'weak',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(weakPasswordData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('should validate password confirmation match', async () => {
    const mismatchedPasswordData = {
      ...validRegistrationData,
      confirmPassword: 'DifferentP@ss1',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(mismatchedPasswordData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('should handle Supabase auth errors', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: {
        message: 'User already registered',
        status: 400,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(validRegistrationData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('already exists');
  });

  it('should handle profile creation failures', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'john.doe@example.com',
        },
        session: null,
      },
      error: null,
    });

    // Mock: Prisma user creation failure
    vi.mocked(prisma.user.create).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(validRegistrationData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Failed to create user profile');
  });

  it('should set default user role to "user"', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'john.doe@example.com',
        },
        session: {
          access_token: 'token-123',
          expires_at: Math.floor(Date.now() / 1000) + 86400,
        },
      },
      error: null,
    });

    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-123',
      email: 'john.doe@example.com',
      name: 'John Doe',
      role: 'user',
      subscriptionTier: 'FREE',
      themePreference: 'system',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(validRegistrationData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.user.role).toBe('user');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: 'user',
      }),
    });
  });

  it('should verify password is hashed by Supabase (not stored in plain text)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'john.doe@example.com',
        },
        session: {
          access_token: 'token-123',
          expires_at: Math.floor(Date.now() / 1000) + 86400,
        },
      },
      error: null,
    });

    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-123',
      email: 'john.doe@example.com',
      name: 'John Doe',
      role: 'user',
      subscriptionTier: 'FREE',
      themePreference: 'system',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(validRegistrationData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await POST(request);

    // Verify password was passed to Supabase (which handles hashing)
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'john.doe@example.com',
      password: 'StrongP@ss1',
      options: expect.any(Object),
    });

    // Verify password was NOT stored in Prisma (no password field in User model)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.not.objectContaining({
        password: expect.anything(),
      }),
    });
  });
});
