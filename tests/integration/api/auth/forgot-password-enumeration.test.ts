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

describe('Password Reset Account Enumeration Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 2,
      resetTime: Date.now() + 3600000,
    });
    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({} as any);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);
  });

  it('should return same message for existing and non-existing emails', async () => {
    const existingEmail = 'existing@example.com';
    const nonExistingEmail = 'nonexisting@example.com';

    // Mock existing user
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-123',
      email: existingEmail,
    } as any);

    const existingRequest = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: existingEmail }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const existingResponse = await POST(existingRequest);
    const existingData = await existingResponse.json();

    // Mock non-existing user
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const nonExistingRequest = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: nonExistingEmail }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const nonExistingResponse = await POST(nonExistingRequest);
    const nonExistingData = await nonExistingResponse.json();

    // Both should return same status and message
    expect(existingResponse.status).toBe(nonExistingResponse.status);
    expect(existingData.success).toBe(nonExistingData.success);
    expect(existingData.message).toBe(nonExistingData.message);
    expect(existingData.message).toContain(
      'If an account exists with this email'
    );
  });

  it('should not create token for non-existing user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexisting@example.com' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    await POST(request);

    // Should not create token or send email
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should create token and send email for existing user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-123',
      email: 'existing@example.com',
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: 'existing@example.com' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    await POST(request);

    // Should create token and send email
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('should log security events for both existing and non-existing users', async () => {
    const existingEmail = 'existing@example.com';
    const nonExistingEmail = 'nonexisting@example.com';

    // Existing user
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-123',
      email: existingEmail,
    } as any);

    const existingRequest = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: existingEmail }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    await POST(existingRequest);

    // Non-existing user
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const nonExistingRequest = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: nonExistingEmail }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    await POST(nonExistingRequest);

    // Both should log security events
    expect(prisma.securityEvent.create).toHaveBeenCalledTimes(2);

    const existingLog = vi.mocked(prisma.securityEvent.create).mock.calls[0][0]
      .data;
    const nonExistingLog = vi.mocked(prisma.securityEvent.create).mock
      .calls[1][0].data;

    expect(existingLog.eventType).toBe('PASSWORD_RESET_REQUESTED');
    expect(existingLog.details).toBeDefined();
    expect((existingLog.details as { success?: boolean }).success).toBe(true);
    expect(nonExistingLog.eventType).toBe('PASSWORD_RESET_REQUEST_FAILED');
    expect(nonExistingLog.details).toBeDefined();
    expect((nonExistingLog.details as { success?: boolean }).success).toBe(
      false
    );
  });
});
