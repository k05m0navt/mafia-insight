import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/users/route';
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
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { withAdminAuth } from '@/lib/apiAuth';

describe('GET /api/admin/users', () => {
  beforeEach(async () => {
    await clearTestDatabase();
    vi.clearAllMocks();
  });

  it('returns paginated user list with default pagination (50 per page)', async () => {
    const adminUser = await createTestAdmin();
    const users = Array.from({ length: 60 }, (_, i) =>
      createTestUser({
        email: `user${i}@example.com`,
        name: `User ${i}`,
      })
    );
    await Promise.all(users);

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findMany).mockResolvedValue(
      (await Promise.all(users.slice(0, 50))) as any
    );
    vi.mocked(prisma.user.count).mockResolvedValue(60);

    const request = new NextRequest('http://localhost:3000/api/admin/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(50);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(50);
    expect(data.pagination.total).toBe(60);
    expect(data.pagination.totalPages).toBe(2);
  });

  it('returns user list with correct fields (email, name, role, account status, last login)', async () => {
    const adminUser = await createTestAdmin();
    const testUser = await createTestUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        avatar: null,
        lastLogin: null,
        createdAt: testUser.createdAt,
        updatedAt: testUser.updatedAt,
      },
    ] as any);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const request = new NextRequest('http://localhost:3000/api/admin/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users[0]).toHaveProperty('email');
    expect(data.users[0]).toHaveProperty('name');
    expect(data.users[0]).toHaveProperty('role');
    expect(data.users[0]).toHaveProperty('lastLogin');
    expect(data.users[0].email).toBe('test@example.com');
    expect(data.users[0].name).toBe('Test User');
  });

  it('implements search functionality by email', async () => {
    const adminUser = await createTestAdmin();
    const testUser = await createTestUser({
      email: 'search@example.com',
      name: 'Search User',
    });

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        avatar: null,
        lastLogin: null,
        createdAt: testUser.createdAt,
        updatedAt: testUser.updatedAt,
      },
    ] as any);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users?search=search@example.com'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              email: expect.objectContaining({
                contains: 'search@example.com',
              }),
            }),
          ]),
        }),
      })
    );
  });

  it('implements search functionality by name', async () => {
    const adminUser = await createTestAdmin();
    const testUser = await createTestUser({
      email: 'test@example.com',
      name: 'John Doe',
    });

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        avatar: null,
        lastLogin: null,
        createdAt: testUser.createdAt,
        updatedAt: testUser.updatedAt,
      },
    ] as any);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users?search=John'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              name: expect.objectContaining({ contains: 'John' }),
            }),
          ]),
        }),
      })
    );
  });

  it('implements filter by role', async () => {
    const adminUser = await createTestAdmin();
    const testAdmin = await createTestAdmin({
      email: 'admin2@example.com',
    });

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: testAdmin.id,
        email: testAdmin.email,
        name: testAdmin.name,
        role: 'admin',
        avatar: null,
        lastLogin: null,
        createdAt: testAdmin.createdAt,
        updatedAt: testAdmin.updatedAt,
      },
    ] as any);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users?role=admin'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'admin',
        }),
      })
    );
    expect(data.users.every((u: any) => u.role === 'admin')).toBe(true);
  });

  it('returns 403 Forbidden for non-admin users', async () => {
    const regularUser = await createTestUser();

    const { AuthorizationError } = await import('@/lib/errors');
    vi.mocked(withAdminAuth).mockRejectedValue(
      new AuthorizationError("Role 'admin' required")
    );

    const request = new NextRequest('http://localhost:3000/api/admin/users');
    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it('returns 401 Unauthorized for unauthenticated users', async () => {
    const { AuthenticationError } = await import('@/lib/errors');
    vi.mocked(withAdminAuth).mockRejectedValue(
      new AuthenticationError('Authentication required')
    );

    const request = new NextRequest('http://localhost:3000/api/admin/users');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('handles pagination correctly (page 2)', async () => {
    const adminUser = await createTestAdmin();
    const users = Array.from({ length: 100 }, (_, i) =>
      createTestUser({
        email: `user${i}@example.com`,
      })
    );
    await Promise.all(users);

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findMany).mockResolvedValue(
      (await Promise.all(users.slice(50, 100))) as any
    );
    vi.mocked(prisma.user.count).mockResolvedValue(100);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users?page=2&limit=50'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.page).toBe(2);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 50,
        take: 50,
      })
    );
  });

  it('enforces maximum limit of 100', async () => {
    const adminUser = await createTestAdmin();

    vi.mocked(withAdminAuth).mockResolvedValue({
      user: adminUser as any,
      role: 'admin',
    });

    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users?limit=200'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.limit).toBe(100);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    );
  });
});
