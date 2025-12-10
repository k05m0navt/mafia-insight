import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/auth/reset-password/route';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    passwordResetToken: {
      findFirst: vi.fn(),
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

describe('GET /api/auth/reset-password (Token Validation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validToken = 'valid-reset-token-123456789012345678901234567890';
  const tokenHash = 'hashed-token';

  it('should validate a valid, unexpired token', async () => {
    const mockToken = {
      id: 'token-123',
      userId: 'user-123',
      tokenHash,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      usedAt: null,
      createdAt: new Date(),
      user: {
        id: 'user-123',
        email: 'user@example.com',
      },
    };

    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([
      mockToken,
    ] as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const request = new NextRequest(
      `http://localhost:3000/api/auth/reset-password?token=${validToken}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.expiresAt).toBeDefined();
  });

  it('should reject expired token', async () => {
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([]);

    const request = new NextRequest(
      `http://localhost:3000/api/auth/reset-password?token=${validToken}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.valid).toBe(false);
    expect(data.error).toContain('Invalid or expired token');
  });

  it('should reject invalid token hash', async () => {
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

    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([
      mockToken,
    ] as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const request = new NextRequest(
      `http://localhost:3000/api/auth/reset-password?token=invalid-token`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.valid).toBe(false);
  });

  it('should reject missing token', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/auth/reset-password'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('Token is required');
  });

  it('should reject already used token', async () => {
    // findMany should not return used tokens (usedAt: null filter)
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([]);

    const request = new NextRequest(
      `http://localhost:3000/api/auth/reset-password?token=${validToken}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.valid).toBe(false);
  });
});

describe('POST /api/auth/reset-password (Password Reset)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validToken = 'valid-reset-token-123456789012345678901234567890';
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

  it('should successfully reset password with valid token', async () => {
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([
      mockToken,
    ] as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const mockSignOut = vi.fn().mockResolvedValue({ error: null });
    const mockSupabaseAdmin = {
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
          signOut: mockSignOut,
        },
      },
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      mockSupabaseAdmin as any
    );

    vi.mocked(prisma.passwordResetToken.update).mockResolvedValue({} as any);
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
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('Password reset successfully');
    expect(mockSupabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
      'user-123',
      {
        password: newPassword,
      }
    );
    expect(mockSignOut).toHaveBeenCalledWith('user-123');
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 'token-123' },
      data: { usedAt: expect.any(Date) },
    });
    expect(prisma.securityEvent.create).toHaveBeenCalled();
  });

  it('should reject invalid password (does not meet requirements)', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token: validToken,
          newPassword: 'weak',
          confirmPassword: 'weak',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
  });

  it('should reject mismatched password confirmation', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token: validToken,
          newPassword: newPassword,
          confirmPassword: 'DifferentP@ss1',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
  });

  it('should reject expired token', async () => {
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token: validToken,
          newPassword,
          confirmPassword: newPassword,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid or expired token');
  });

  it('should mark token as used after successful reset', async () => {
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([
      mockToken,
    ] as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const mockSupabaseAdmin = {
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
          signOut: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      mockSupabaseAdmin as any
    );

    vi.mocked(prisma.passwordResetToken.update).mockResolvedValue({} as any);
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
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    await POST(request);

    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 'token-123' },
      data: { usedAt: expect.any(Date) },
    });
  });

  it('should log security event for password reset completion', async () => {
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([
      mockToken,
    ] as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const mockSupabaseAdmin = {
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
          signOut: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      mockSupabaseAdmin as any
    );

    vi.mocked(prisma.passwordResetToken.update).mockResolvedValue({} as any);
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
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
      }
    );

    await POST(request);

    expect(prisma.securityEvent.create).toHaveBeenCalled();
    const logCall = vi.mocked(prisma.securityEvent.create).mock.calls[0];
    expect(logCall[0].data.eventType).toBe('PASSWORD_RESET_COMPLETED');
    expect(logCall[0].data.userId).toBe('user-123');
    expect(logCall[0].data.email).toBe('user@example.com');
  });

  it('should handle Supabase password update errors', async () => {
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([
      mockToken,
    ] as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const mockSupabaseAdmin = {
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        },
      },
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      mockSupabaseAdmin as any
    );

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
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Failed to update password');
    expect(prisma.securityEvent.create).toHaveBeenCalled();
  });

  it('should invalidate all user sessions after password reset', async () => {
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([
      mockToken,
    ] as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const mockSignOut = vi.fn().mockResolvedValue({ error: null });
    const mockSupabaseAdmin = {
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
          signOut: mockSignOut,
        },
      },
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      mockSupabaseAdmin as any
    );

    vi.mocked(prisma.passwordResetToken.update).mockResolvedValue({} as any);
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
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Verify session invalidation was called
    expect(mockSignOut).toHaveBeenCalledWith('user-123');
  });

  it('should continue password reset even if session invalidation fails', async () => {
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([
      mockToken,
    ] as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const mockSignOut = vi.fn().mockResolvedValue({
      error: { message: 'Session invalidation failed' },
    });
    const mockSupabaseAdmin = {
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
          signOut: mockSignOut,
        },
      },
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      mockSupabaseAdmin as any
    );

    vi.mocked(prisma.passwordResetToken.update).mockResolvedValue({} as any);
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
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Password reset should still succeed even if session invalidation fails
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSignOut).toHaveBeenCalledWith('user-123');
  });
});
