import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateNotLastAdmin } from '@/lib/validation/admin-validation';
import { ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/db';
import {
  createTestAdmin,
  createTestUser,
  clearTestDatabase,
} from '../../../setup';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Admin Validation', () => {
  beforeEach(async () => {
    await clearTestDatabase();
    vi.clearAllMocks();
  });

  describe('validateNotLastAdmin', () => {
    it('allows changing to admin role', async () => {
      const user = await createTestUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        role: 'user',
      } as any);

      await expect(
        validateNotLastAdmin(user.id, 'admin')
      ).resolves.not.toThrow();
    });

    it('allows changing non-admin user to any role', async () => {
      const user = await createTestUser({ role: 'user' });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        role: 'user',
      } as any);

      await expect(
        validateNotLastAdmin(user.id, 'guest')
      ).resolves.not.toThrow();
      await expect(
        validateNotLastAdmin(user.id, 'moderator')
      ).resolves.not.toThrow();
    });

    it('allows removing admin if multiple admins exist', async () => {
      const admin1 = await createTestAdmin({ email: 'admin1@example.com' });
      const admin2 = await createTestAdmin({ email: 'admin2@example.com' });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        role: 'admin',
      } as any);
      vi.mocked(prisma.user.count).mockResolvedValue(2);

      await expect(
        validateNotLastAdmin(admin1.id, 'user')
      ).resolves.not.toThrow();
    });

    it('prevents removing last admin', async () => {
      const admin = await createTestAdmin();

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        role: 'admin',
      } as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      await expect(validateNotLastAdmin(admin.id, 'user')).rejects.toThrow(
        ValidationError
      );
      await expect(validateNotLastAdmin(admin.id, 'user')).rejects.toThrow(
        'Cannot remove the last administrator'
      );
    });

    it('throws ValidationError with clear message when removing last admin', async () => {
      const admin = await createTestAdmin();

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        role: 'admin',
      } as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      try {
        await validateNotLastAdmin(admin.id, 'user');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain(
          'Cannot remove the last administrator'
        );
        expect((error as ValidationError).field).toBe('role');
      }
    });

    it('throws ValidationError when user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        validateNotLastAdmin('non-existent', 'user')
      ).rejects.toThrow(ValidationError);
      await expect(
        validateNotLastAdmin('non-existent', 'user')
      ).rejects.toThrow('User not found');
    });

    it('handles case-insensitive role comparison', async () => {
      const user = await createTestUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        role: 'user',
      } as any);

      await expect(
        validateNotLastAdmin(user.id, 'ADMIN')
      ).resolves.not.toThrow();
      await expect(
        validateNotLastAdmin(user.id, 'Admin')
      ).resolves.not.toThrow();
    });
  });
});
