import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logAdminAction, getAuditLogs } from '@/lib/audit/audit-log';
import { prisma } from '@/lib/db';
import { AuditActionType } from '@prisma/client';
import {
  createTestAdmin,
  createTestUser,
  clearTestDatabase,
} from '../../../setup';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Audit Log Service', () => {
  beforeEach(async () => {
    await clearTestDatabase();
    vi.clearAllMocks();
  });

  describe('logAdminAction', () => {
    it('creates audit log entry with all required fields', async () => {
      const adminUser = await createTestAdmin();
      const targetUser = await createTestUser();

      vi.mocked(prisma.auditLog.create).mockResolvedValue({
        id: 'audit-123',
        actionType: AuditActionType.ROLE_CHANGE,
        adminUserId: adminUser.id,
        targetUserId: targetUser.id,
        oldValue: 'user',
        newValue: 'admin',
        metadata: {},
        createdAt: new Date(),
      } as any);

      await logAdminAction({
        actionType: AuditActionType.ROLE_CHANGE,
        adminUserId: adminUser.id,
        targetUserId: targetUser.id,
        oldValue: 'user',
        newValue: 'admin',
        metadata: {
          adminEmail: adminUser.email,
          targetEmail: targetUser.email,
        },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actionType: AuditActionType.ROLE_CHANGE,
          adminUserId: adminUser.id,
          targetUserId: targetUser.id,
          oldValue: 'user',
          newValue: 'admin',
          metadata: {
            adminEmail: adminUser.email,
            targetEmail: targetUser.email,
          },
        },
      });
    });

    it('handles optional fields correctly', async () => {
      const adminUser = await createTestAdmin();

      vi.mocked(prisma.auditLog.create).mockResolvedValue({
        id: 'audit-123',
        actionType: AuditActionType.ROLE_CHANGE,
        adminUserId: adminUser.id,
        targetUserId: null,
        oldValue: null,
        newValue: null,
        metadata: {},
        createdAt: new Date(),
      } as any);

      await logAdminAction({
        actionType: AuditActionType.ROLE_CHANGE,
        adminUserId: adminUser.id,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actionType: AuditActionType.ROLE_CHANGE,
          adminUserId: adminUser.id,
          targetUserId: undefined,
          oldValue: undefined,
          newValue: undefined,
          metadata: {},
        },
      });
    });

    it('does not throw errors on audit log failures', async () => {
      const adminUser = await createTestAdmin();

      vi.mocked(prisma.auditLog.create).mockRejectedValue(
        new Error('Database error')
      );

      // Should not throw
      await expect(
        logAdminAction({
          actionType: AuditActionType.ROLE_CHANGE,
          adminUserId: adminUser.id,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getAuditLogs', () => {
    it('returns paginated audit log entries', async () => {
      const adminUser = await createTestAdmin();
      const targetUser = await createTestUser();

      const mockEntries = [
        {
          id: 'audit-1',
          actionType: AuditActionType.ROLE_CHANGE,
          adminUserId: adminUser.id,
          targetUserId: targetUser.id,
          oldValue: 'user',
          newValue: 'admin',
          metadata: {},
          createdAt: new Date(),
          admin: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
          },
          target: {
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
          },
        },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockEntries as any);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(1);

      const result = await getAuditLogs({
        page: 1,
        limit: 50,
      });

      expect(result.entries).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('filters by action type', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      await getAuditLogs({
        actionType: AuditActionType.ROLE_CHANGE,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            actionType: AuditActionType.ROLE_CHANGE,
          }),
        })
      );
    });

    it('filters by admin user ID', async () => {
      const adminUser = await createTestAdmin();

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      await getAuditLogs({
        adminUserId: adminUser.id,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            adminUserId: adminUser.id,
          }),
        })
      );
    });

    it('filters by target user ID', async () => {
      const targetUser = await createTestUser();

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      await getAuditLogs({
        targetUserId: targetUser.id,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            targetUserId: targetUser.id,
          }),
        })
      );
    });

    it('filters by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      await getAuditLogs({
        startDate,
        endDate,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('includes admin and target user information', async () => {
      const adminUser = await createTestAdmin();
      const targetUser = await createTestUser();

      const mockEntries = [
        {
          id: 'audit-1',
          actionType: AuditActionType.ROLE_CHANGE,
          adminUserId: adminUser.id,
          targetUserId: targetUser.id,
          oldValue: 'user',
          newValue: 'admin',
          metadata: {},
          createdAt: new Date(),
          admin: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
          },
          target: {
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
          },
        },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockEntries as any);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(1);

      const result = await getAuditLogs({});

      expect(result.entries[0]).toHaveProperty('admin');
      expect(result.entries[0]).toHaveProperty('target');
      expect(result.entries[0].admin.email).toBe(adminUser.email);
      expect(result.entries[0].target.email).toBe(targetUser.email);
    });
  });
});
