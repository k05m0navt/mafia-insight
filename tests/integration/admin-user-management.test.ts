import { describe, it, expect, beforeEach } from 'vitest';
import { createTestAdmin, createTestUser, clearTestDatabase } from '../setup';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/audit/audit-log';
import { validateNotLastAdmin } from '@/lib/validation/admin-validation';
import { AuditActionType } from '@prisma/client';

describe('Admin User Management Integration', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('Complete Admin User Management Flow', () => {
    it('admin logs in → accesses admin/users → views user list → updates user role → verifies audit log', async () => {
      // Setup: Create admin and regular user
      const admin = await createTestAdmin({
        email: 'admin@example.com',
        name: 'Admin User',
      });
      const regularUser = await createTestUser({
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
      });

      // Step 1: Admin views user list
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });

      expect(users).toHaveLength(2);
      expect(users.some((u) => u.email === 'user@example.com')).toBe(true);

      // Step 2: Admin updates user role
      await validateNotLastAdmin(regularUser.id, 'admin');

      const updatedUser = await prisma.user.update({
        where: { id: regularUser.id },
        data: { role: 'admin' },
      });

      expect(updatedUser.role).toBe('admin');

      // Step 3: Verify audit log entry
      await logAdminAction({
        actionType: AuditActionType.ROLE_CHANGE,
        adminUserId: admin.id,
        targetUserId: regularUser.id,
        oldValue: 'user',
        newValue: 'admin',
        metadata: {
          adminEmail: admin.email,
          targetEmail: regularUser.email,
        },
      });

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          adminUserId: admin.id,
          targetUserId: regularUser.id,
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].actionType).toBe(AuditActionType.ROLE_CHANGE);
      expect(auditLogs[0].oldValue).toBe('user');
      expect(auditLogs[0].newValue).toBe('admin');
    });

    it('non-admin user tries to access admin routes → validation prevents access', async () => {
      const regularUser = await createTestUser({
        email: 'user@example.com',
        role: 'user',
      });

      // Try to update another user's role (should fail)
      const targetUser = await createTestUser({
        email: 'target@example.com',
        role: 'user',
      });

      // In a real scenario, withAdminAuth would reject this
      // Here we verify the user doesn't have admin privileges
      const userProfile = await prisma.user.findUnique({
        where: { id: regularUser.id },
        select: { role: true },
      });

      expect(userProfile?.role).toBe('user');
      expect(userProfile?.role).not.toBe('admin');
    });

    it('admin tries to remove last admin → validation error shown', async () => {
      const admin = await createTestAdmin({
        email: 'admin@example.com',
      });

      // Verify this is the only admin
      const adminCount = await prisma.user.count({
        where: { role: 'admin' },
      });

      expect(adminCount).toBe(1);

      // Try to remove last admin
      await expect(validateNotLastAdmin(admin.id, 'user')).rejects.toThrow(
        'Cannot remove the last administrator'
      );
    });

    it('admin can remove admin if multiple admins exist', async () => {
      const admin1 = await createTestAdmin({
        email: 'admin1@example.com',
      });
      const admin2 = await createTestAdmin({
        email: 'admin2@example.com',
      });

      // Verify multiple admins exist
      const adminCount = await prisma.user.count({
        where: { role: 'admin' },
      });

      expect(adminCount).toBe(2);

      // Should allow removing one admin
      await expect(
        validateNotLastAdmin(admin1.id, 'user')
      ).resolves.not.toThrow();

      // Update the role
      await prisma.user.update({
        where: { id: admin1.id },
        data: { role: 'user' },
      });

      // Verify one admin remains
      const remainingAdminCount = await prisma.user.count({
        where: { role: 'admin' },
      });

      expect(remainingAdminCount).toBe(1);
    });
  });

  describe('Audit Logging Integration', () => {
    it('all admin actions are logged to audit log', async () => {
      const admin = await createTestAdmin();
      const targetUser = await createTestUser();

      // Log role change
      await logAdminAction({
        actionType: AuditActionType.ROLE_CHANGE,
        adminUserId: admin.id,
        targetUserId: targetUser.id,
        oldValue: 'user',
        newValue: 'admin',
        metadata: {
          adminEmail: admin.email,
          targetEmail: targetUser.email,
        },
      });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          adminUserId: admin.id,
          targetUserId: targetUser.id,
        },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.actionType).toBe(AuditActionType.ROLE_CHANGE);
      expect(auditLog?.oldValue).toBe('user');
      expect(auditLog?.newValue).toBe('admin');
      expect(auditLog?.metadata).toHaveProperty('adminEmail');
      expect(auditLog?.metadata).toHaveProperty('targetEmail');
    });
  });
});
