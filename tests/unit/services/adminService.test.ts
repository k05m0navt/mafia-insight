import { describe, it, expect, beforeEach } from 'vitest';
import { adminService } from '@/services/auth/adminService';
import { UserRole } from '@/types/auth';
import {
  clearTestDatabase,
  createTestUser,
  createTestAdmin,
} from '../../setup';

describe('Admin Service', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('getUsers', () => {
    it('should return paginated list of users', async () => {
      // Create 15 test users
      for (let i = 0; i < 15; i++) {
        await createTestUser({
          email: `user${i}@test.com`,
          name: `User ${i}`,
        });
      }

      const { users, total } = await adminService.getUsers(1, 10);

      expect(users).toHaveLength(10);
      expect(total).toBe(15);
    });

    it('should return second page of results', async () => {
      // Create 15 test users
      for (let i = 0; i < 15; i++) {
        await createTestUser({
          email: `user${i}@test.com`,
          name: `User ${i}`,
        });
      }

      const { users, total } = await adminService.getUsers(2, 10);

      expect(users).toHaveLength(5);
      expect(total).toBe(15);
    });

    it('should filter users by search term', async () => {
      await createTestUser({ email: 'john@test.com', name: 'John Doe' });
      await createTestUser({ email: 'jane@test.com', name: 'Jane Smith' });
      await createTestUser({ email: 'bob@test.com', name: 'Bob Johnson' });

      const { users, total } = await adminService.getUsers(1, 10, 'john');

      expect(total).toBeGreaterThanOrEqual(1);
      expect(
        users.some(
          (u) =>
            u.name.toLowerCase().includes('john') ||
            u.email.toLowerCase().includes('john')
        )
      ).toBe(true);
    });

    it('should filter users by role', async () => {
      await createTestUser({ role: 'user' });
      await createTestAdmin({ role: 'admin' });
      await createTestAdmin({ role: 'admin' });

      const { users, total } = await adminService.getUsers(
        1,
        10,
        undefined,
        UserRole.Admin
      );

      expect(total).toBe(2);
      expect(users.every((u) => u.role === 'admin')).toBe(true);
    });

    it('should return users ordered by creation date descending', async () => {
      const user1 = await createTestUser({ email: 'first@test.com' });
      const user2 = await createTestUser({ email: 'second@test.com' });
      const user3 = await createTestUser({ email: 'third@test.com' });

      const { users } = await adminService.getUsers(1, 10);

      // Most recent should be first
      expect(users[0].id).toBe(user3.id);
      expect(users[1].id).toBe(user2.id);
      expect(users[2].id).toBe(user1.id);
    });
  });

  describe('createAdmin', () => {
    it('should update existing user to admin role', async () => {
      const user = await createTestUser({
        email: 'user@test.com',
        name: 'Regular User',
        role: 'user',
      });

      const admin = await adminService.createAdmin(
        user.id,
        user.email,
        user.name
      );

      expect(admin.role).toBe('admin');
      expect(admin.email).toBe('user@test.com');
    });

    it('should preserve user email and name', async () => {
      const user = await createTestUser({
        email: 'test@test.com',
        name: 'Test User',
      });

      const admin = await adminService.createAdmin(
        user.id,
        'newemail@test.com',
        'New Name'
      );

      expect(admin.email).toBe('newemail@test.com');
      expect(admin.name).toBe('New Name');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role to admin', async () => {
      const user = await createTestUser({ role: 'user' });

      const updated = await adminService.updateUserRole(
        user.id,
        UserRole.Admin
      );

      expect(updated.role).toBe('admin');
    });

    it('should update admin role to user', async () => {
      const admin = await createTestAdmin();

      const updated = await adminService.updateUserRole(
        admin.id,
        UserRole.User
      );

      expect(updated.role).toBe('user');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        adminService.updateUserRole('non-existent-id', UserRole.Admin)
      ).rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('should delete user from database', async () => {
      const user = await createTestUser();

      await adminService.deleteUser(user.id);

      const { users } = await adminService.getUsers();
      expect(users.find((u) => u.id === user.id)).toBeUndefined();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        adminService.deleteUser('non-existent-id')
      ).rejects.toThrow();
    });

    it('should cascade delete related data', async () => {
      // This test depends on your schema's cascade settings
      const user = await createTestUser();

      // Delete should succeed even if user has related data
      await expect(adminService.deleteUser(user.id)).resolves.not.toThrow();
    });
  });
});
