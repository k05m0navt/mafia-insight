import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/admin/users/[id]/role/route';
import { prisma } from '@/lib/db';
import {
  createTestUser,
  createTestAdmin,
  clearTestDatabase,
} from '../../../setup';

// Mock dependencies
vi.mock('@/lib/apiAuth', () => ({
  withAdminAuth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/validation/admin-validation', () => ({
  validateNotLastAdmin: vi.fn(),
}));

vi.mock('@/lib/audit/audit-log', () => ({
  logAdminAction: vi.fn(),
}));

import { withAdminAuth } from '@/lib/apiAuth';
import { validateNotLastAdmin } from '@/lib/validation/admin-validation';
import { logAdminAction } from '@/lib/audit/audit-log';
import { AuditActionType } from '@prisma/client';

describe('PATCH /api/admin/users/[id]/role', () => {
  beforeEach(async () => {
    await clearTestDatabase();
    vi.clearAllMocks();
  });

  it('updates user role successfully', async () => {
    const adminUser = await createTestAdmin();
    const targetUser = await createTestUser({
      email: 'target@example.com',
      role: 'user',
    });

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: 'user',
    } as any);

    vi.mocked(validateNotLastAdmin).mockResolvedValue(undefined);

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: 'admin',
      avatar: null,
      lastLogin: null,
      createdAt: targetUser.createdAt,
      updatedAt: new Date(),
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/test-id/role',
      {
        method: 'PATCH',
        body: JSON.stringify({ role: 'admin' }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: targetUser.id }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.role).toBe('admin');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: targetUser.id },
      data: { role: 'admin' },
      select: expect.any(Object),
    });
  });

  it('validates available roles (User, Admin)', async () => {
    const adminUser = await createTestAdmin();
    const targetUser = await createTestUser();

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: 'user',
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/test-id/role',
      {
        method: 'PATCH',
        body: JSON.stringify({ role: 'invalid-role' }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: targetUser.id }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('prevents removing last admin', async () => {
    const adminUser = await createTestAdmin();
    const targetUser = await createTestAdmin({
      email: 'admin2@example.com',
    });

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: 'admin',
    } as any);

    const { ValidationError } = await import('@/lib/errors');
    vi.mocked(validateNotLastAdmin).mockRejectedValue(
      new ValidationError(
        'Cannot remove the last administrator. At least one admin must remain.',
        'role'
      )
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/test-id/role',
      {
        method: 'PATCH',
        body: JSON.stringify({ role: 'user' }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: targetUser.id }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('logs role changes to audit log', async () => {
    const adminUser = await createTestAdmin();
    const targetUser = await createTestUser({
      email: 'target@example.com',
      role: 'user',
    });

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: 'user',
    } as any);

    vi.mocked(validateNotLastAdmin).mockResolvedValue(undefined);

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: 'admin',
      avatar: null,
      lastLogin: null,
      createdAt: targetUser.createdAt,
      updatedAt: new Date(),
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/test-id/role',
      {
        method: 'PATCH',
        body: JSON.stringify({ role: 'admin' }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: targetUser.id }),
    });

    expect(response.status).toBe(200);
    expect(logAdminAction).toHaveBeenCalledWith({
      actionType: AuditActionType.ROLE_CHANGE,
      adminUserId: adminUser.id,
      targetUserId: targetUser.id,
      oldValue: 'user',
      newValue: 'admin',
      metadata: expect.objectContaining({
        adminEmail: adminUser.email,
        targetEmail: targetUser.email,
      }),
    });
  });

  it('returns 404 when user is not found', async () => {
    const adminUser = await createTestAdmin();

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/non-existent/role',
      {
        method: 'PATCH',
        body: JSON.stringify({ role: 'admin' }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('returns 403 Forbidden for non-admin users', async () => {
    const { AuthorizationError } = await import('@/lib/errors');
    vi.mocked(withAdminAuth).mockRejectedValue(
      new AuthorizationError("Role 'admin' required")
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/test-id/role',
      {
        method: 'PATCH',
        body: JSON.stringify({ role: 'admin' }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'test-id' }),
    });

    expect(response.status).toBe(403);
  });

  it('returns 401 Unauthorized for unauthenticated users', async () => {
    const { AuthenticationError } = await import('@/lib/errors');
    vi.mocked(withAdminAuth).mockRejectedValue(
      new AuthenticationError('Authentication required')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/test-id/role',
      {
        method: 'PATCH',
        body: JSON.stringify({ role: 'admin' }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'test-id' }),
    });

    expect(response.status).toBe(401);
  });
});
