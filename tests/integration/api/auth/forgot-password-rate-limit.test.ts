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

describe('Password Reset Rate Limiting Integration', () => {
  const email = 'user@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-123',
      email,
    } as any);
    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({} as any);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);
  });

  it('should allow 3 requests per hour per email', async () => {
    // First 3 requests should succeed
    for (let i = 0; i < 3; i++) {
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 3 - i - 1,
        resetTime: Date.now() + 3600000,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    }
  });

  it('should reject 4th request within same hour', async () => {
    // First 3 requests succeed
    for (let i = 0; i < 3; i++) {
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 3 - i - 1,
        resetTime: Date.now() + 3600000,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      await POST(request);
    }

    // 4th request should be rate limited
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 3600000,
      retryAfter: 3600,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Too many password reset requests');
    expect(response.headers.get('Retry-After')).toBe('3600');
  });

  it('should log rate limit violations to security_events', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 3600000,
      retryAfter: 3600,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
      }
    );

    await POST(request);

    expect(prisma.securityEvent.create).toHaveBeenCalled();
    const logCall = vi.mocked(prisma.securityEvent.create).mock.calls[0];
    expect(logCall[0].data.eventType).toBe(
      'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
    );
    expect(logCall[0].data.email).toBe(email);
  });
});
