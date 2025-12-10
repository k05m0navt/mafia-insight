import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/forgot-password/route';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
    },
    securityEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rateLimiter', () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimiter';
import { sendPasswordResetEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: rate limit allows request
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 2,
      resetTime: Date.now() + 3600000,
    });
  });

  const validEmail = 'user@example.com';
  const validRequest = {
    email: validEmail,
  };

  it('should successfully send password reset email for existing user', async () => {
    // Mock: User exists
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-123',
      email: validEmail,
      name: 'Test User',
      role: 'user',
    } as any);

    // Mock: Token creation
    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({
      id: 'token-123',
      userId: 'user-123',
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
      createdAt: new Date(),
    } as any);

    // Mock: bcrypt hash
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-token' as never);

    // Mock: Email sending
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();

    // Mock: Security event logging
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(validRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('If an account exists with this email');
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(sendPasswordResetEmail).toHaveBeenCalled();
    expect(prisma.securityEvent.create).toHaveBeenCalled();
  });

  it('should return same message for non-existing user (account enumeration prevention)', async () => {
    // Mock: User does not exist
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    // Mock: Security event logging
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(validRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('If an account exists with this email');
    // Should not create token for non-existing user
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    // But should still log the attempt
    expect(prisma.securityEvent.create).toHaveBeenCalled();
  });

  it('should reject invalid email format', async () => {
    const invalidRequest = {
      email: 'invalid-email',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(invalidRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid email format');
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('should enforce rate limiting (3 requests per hour)', async () => {
    // Mock: Rate limit exceeded
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 3600000,
      retryAfter: 3600,
    });

    // Mock: Security event logging for rate limit
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(validRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Too many password reset requests');
    expect(response.headers.get('Retry-After')).toBe('3600');
    expect(prisma.securityEvent.create).toHaveBeenCalled();
  });

  it('should generate secure random token (32+ characters, URL-safe)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-123',
      email: validEmail,
    } as any);

    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({} as any);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(validRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    await POST(request);

    // Verify token was hashed (bcrypt.hash called)
    expect(bcrypt.hash).toHaveBeenCalled();
    const hashCall = vi.mocked(bcrypt.hash).mock.calls[0];
    expect(hashCall[0].length).toBeGreaterThanOrEqual(32);
    // Token should be URL-safe (base64url)
    expect(hashCall[0]).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('should store token with 1 hour expiration', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-123',
      email: validEmail,
    } as any);

    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({} as any);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(validRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const beforeTime = Date.now();
    await POST(request);
    const afterTime = Date.now();

    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    const createCall = vi.mocked(prisma.passwordResetToken.create).mock
      .calls[0];
    const expiresAt = createCall[0].data.expiresAt as Date;
    const expirationTime = expiresAt.getTime();
    const expectedExpiration = beforeTime + 3600000; // 1 hour

    // Expiration should be approximately 1 hour from now (within 1 second tolerance)
    expect(expirationTime).toBeGreaterThanOrEqual(expectedExpiration - 1000);
    expect(expirationTime).toBeLessThanOrEqual(afterTime + 3600000 + 1000);
  });

  it('should log security events for password reset requests', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-123',
      email: validEmail,
    } as any);

    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({} as any);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(validRequest),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
      }
    );

    await POST(request);

    expect(prisma.securityEvent.create).toHaveBeenCalled();
    const logCall = vi.mocked(prisma.securityEvent.create).mock.calls[0];
    expect(logCall[0].data.eventType).toBe('PASSWORD_RESET_REQUESTED');
    expect(logCall[0].data.email).toBe(validEmail);
    expect(logCall[0].data.userId).toBe('user-123');
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-123',
      email: validEmail,
    } as any);

    // Mock: Token creation fails
    vi.mocked(prisma.passwordResetToken.create).mockRejectedValue(
      new Error('Database error')
    );

    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(validRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Should still return success message (account enumeration prevention)
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('If an account exists with this email');
  });
});
