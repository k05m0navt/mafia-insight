import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/auth/reset-password/route';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    passwordResetToken: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    securityEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

describe('Password Reset Token Single-Use Enforcement', () => {
  const validToken = 'valid-token-123';
  const tokenHash = 'hashed-token';
  const newPassword = 'NewP@ssw0rd123';

  const mockToken = {
    id: 'token-123',
    userId: 'user-123',
    tokenHash,
    expiresAt: new Date(Date.now() + 3600000),
    usedAt: null,
    createdAt: new Date(),
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow token to be used once', async () => {
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([
      mockToken,
    ] as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const mockSupabaseAdmin = {
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      mockSupabaseAdmin as any
    );

    vi.mocked(prisma.passwordResetToken.update).mockResolvedValue({
      ...mockToken,
      usedAt: new Date(),
    } as any);
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token: validToken,
          newPassword,
          confirmPassword: newPassword,
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 'token-123' },
      data: { usedAt: expect.any(Date) },
    });
  });

  it('should reject token on second use attempt', async () => {
    // First use - token is valid
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValueOnce([
      mockToken,
    ] as any);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

    const mockSupabaseAdmin = {
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      mockSupabaseAdmin as any
    );

    vi.mocked(prisma.passwordResetToken.update).mockResolvedValueOnce({
      ...mockToken,
      usedAt: new Date(),
    } as any);
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);

    const firstRequest = new NextRequest(
      'http://localhost:3000/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token: validToken,
          newPassword,
          confirmPassword: newPassword,
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    await POST(firstRequest);

    // Second use attempt - token should not be found (usedAt: null filter)
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValueOnce([]);

    const secondRequest = new NextRequest(
      'http://localhost:3000/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token: validToken,
          newPassword: 'AnotherP@ss1',
          confirmPassword: 'AnotherP@ss1',
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await POST(secondRequest);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid or expired token');
  });

  it('should not allow GET validation after token is used', async () => {
    // First use the token
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValueOnce([
      mockToken,
    ] as any);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

    const mockSupabaseAdmin = {
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      mockSupabaseAdmin as any
    );

    vi.mocked(prisma.passwordResetToken.update).mockResolvedValueOnce({
      ...mockToken,
      usedAt: new Date(),
    } as any);
    vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as any);

    const postRequest = new NextRequest(
      'http://localhost:3000/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token: validToken,
          newPassword,
          confirmPassword: newPassword,
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    await POST(postRequest);

    // Try to validate the used token
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValueOnce([]);

    const getRequest = new NextRequest(
      `http://localhost:3000/api/auth/reset-password?token=${validToken}`
    );

    const response = await GET(getRequest);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.valid).toBe(false);
  });
});
