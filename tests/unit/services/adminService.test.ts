import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAllUsers,
  createAdmin,
  updateUserRole,
  deactivateUser,
  getUserStats,
} from '@/services/auth/adminService';
import { prisma } from '@/lib/db';
import { clearTestDatabase, createTestUser } from '../../setup';

const { createClientMock, createUserMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createUserMock: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

describe('adminService', () => {
  beforeEach(async () => {
    await clearTestDatabase();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    createClientMock.mockReturnValue({
      auth: {
        admin: {
          createUser: createUserMock,
        },
      },
    });
    createUserMock.mockResolvedValue({
      data: { user: { id: 'supabase-user-id' } },
      error: null,
    });
  });

  afterEach(async () => {
    await clearTestDatabase();
    vi.resetAllMocks();
  });

  it('retrieves all users ordered by creation date', async () => {
    const first = await createTestUser({ email: 'first@example.com' });
    await prisma.user.update({
      where: { id: first.id },
      data: { createdAt: new Date('2023-01-01T00:00:00Z') },
    });

    const second = await createTestUser({ email: 'second@example.com' });
    await prisma.user.update({
      where: { id: second.id },
      data: { createdAt: new Date('2024-01-01T00:00:00Z') },
    });

    const users = await getAllUsers();

    expect(users).toHaveLength(2);
    expect(users[0].email).toBe('second@example.com');
    expect(users[1].email).toBe('first@example.com');
  });

  it('creates an admin profile via Supabase and Prisma', async () => {
    const admin = await createAdmin({
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'test-password',
    });

    expect(createUserMock).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'test-password',
      email_confirm: true,
      user_metadata: { name: 'Admin User' },
    });

    expect(admin.role).toBe('admin');
    expect(admin.email).toBe('admin@example.com');

    const stored = await prisma.user.findUnique({
      where: { id: 'supabase-user-id' },
    });
    expect(stored?.role).toBe('admin');
  });

  it('updates user roles', async () => {
    const user = await createTestUser({ role: 'user' });

    const updated = await updateUserRole(user.id, 'admin');

    expect(updated.role).toBe('admin');
    const fromDb = await prisma.user.findUnique({ where: { id: user.id } });
    expect(fromDb?.role).toBe('admin');
  });

  it('deactivates a user by setting role to guest', async () => {
    const user = await createTestUser({ role: 'user' });

    await deactivateUser(user.id);

    const fromDb = await prisma.user.findUnique({ where: { id: user.id } });
    expect(fromDb?.role).toBe('guest');
  });

  it('computes user statistics', async () => {
    await createTestUser({ role: 'admin' });
    await createTestUser({ role: 'user' });

    const stats = await getUserStats();

    expect(stats.totalUsers).toBe(2);
    expect(stats.adminCount).toBe(1);
    expect(stats.moderatorCount).toBe(0);
    expect(stats.activeUsers).toBe(0);
  });
});
