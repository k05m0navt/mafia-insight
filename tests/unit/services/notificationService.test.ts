import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAdminNotification,
  sendAdminAlerts,
  markNotificationAsRead,
  getUnreadNotifications,
} from '@/services/sync/notificationService';
import { prisma } from '@/lib/db';
import { clearTestDatabase, createTestAdmin } from '../../setup';

// Mock the email service
vi.mock('@/lib/email/adminAlerts', () => ({
  sendAdminAlert: vi.fn().mockResolvedValue({
    success: true,
    emailLogId: 'test-email-log-id',
  }),
}));

describe('Notification Service', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('createAdminNotification', () => {
    it('should create notifications for all admin users', async () => {
      // Create 2 admin users
      const admin1 = await createTestAdmin({
        email: 'admin1@test.com',
        name: 'Admin One',
      });
      const admin2 = await createTestAdmin({
        email: 'admin2@test.com',
        name: 'Admin Two',
      });

      await createAdminNotification({
        type: 'SYNC_FAILURE',
        title: 'Test Sync Failed',
        message: 'This is a test sync failure notification',
        details: {
          syncLogId: 'test-sync-123',
          error: 'Connection timeout',
        },
      });

      // Verify notifications were created
      const admin1Notifications = await prisma.notification.findMany({
        where: { userId: admin1.id },
      });
      const admin2Notifications = await prisma.notification.findMany({
        where: { userId: admin2.id },
      });

      expect(admin1Notifications).toHaveLength(1);
      expect(admin2Notifications).toHaveLength(1);

      expect(admin1Notifications[0]).toMatchObject({
        type: 'SYNC_FAILURE',
        title: 'Test Sync Failed',
        message: 'This is a test sync failure notification',
        read: false,
      });
    });

    it('should handle case when no admins exist', async () => {
      // No admins created
      await expect(
        createAdminNotification({
          type: 'SYSTEM_ALERT',
          title: 'Test Alert',
          message: 'Test message',
        })
      ).resolves.not.toThrow();

      const notifications = await prisma.notification.findMany();
      expect(notifications).toHaveLength(0);
    });

    it('should store notification details as JSON', async () => {
      const admin = await createTestAdmin();

      const details = {
        syncLogId: 'test-sync-123',
        recordsProcessed: 100,
        errors: ['Error 1', 'Error 2'],
      };

      await createAdminNotification({
        type: 'SYNC_SUCCESS',
        title: 'Sync Completed',
        message: 'Sync finished successfully',
        details,
      });

      const notifications = await prisma.notification.findMany({
        where: { userId: admin.id },
      });

      expect(notifications[0].details).toEqual(details);
    });
  });

  describe('sendAdminAlerts', () => {
    it('should create in-app notification and send email', async () => {
      const admin = await createTestAdmin();

      await sendAdminAlerts({
        type: 'SYNC_FAILURE',
        title: 'Test Alert',
        message: 'Test message',
      });

      // Verify in-app notification was created
      const notifications = await prisma.notification.findMany({
        where: { userId: admin.id },
      });
      expect(notifications).toHaveLength(1);

      // Email mock should have been called
      const { sendAdminAlert } = await import('@/lib/email/adminAlerts');
      expect(sendAdminAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SYNC_FAILURE',
          title: 'Test Alert',
          message: 'Test message',
        })
      );
    });

    it('should include syncLogId in email details', async () => {
      await createTestAdmin();

      await sendAdminAlerts(
        {
          type: 'SYNC_FAILURE',
          title: 'Test Alert',
          message: 'Test message',
          details: { error: 'timeout' },
        },
        'sync-log-123'
      );

      const { sendAdminAlert } = await import('@/lib/email/adminAlerts');
      expect(sendAdminAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          syncLogId: 'sync-log-123',
        })
      );
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      const admin = await createTestAdmin();

      // Create notification
      const notification = await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM_ALERT',
          title: 'Test',
          message: 'Test message',
          read: false,
        },
      });

      // Mark as read
      await markNotificationAsRead(notification.id, admin.id);

      // Verify
      const updated = await prisma.notification.findUnique({
        where: { id: notification.id },
      });

      expect(updated?.read).toBe(true);
    });

    it('should only mark notification for the correct user', async () => {
      const admin1 = await createTestAdmin({ email: 'admin1@test.com' });
      const admin2 = await createTestAdmin({ email: 'admin2@test.com' });

      const notification1 = await prisma.notification.create({
        data: {
          userId: admin1.id,
          type: 'SYSTEM_ALERT',
          title: 'Test',
          message: 'Test message',
          read: false,
        },
      });

      // Try to mark as read with wrong user
      await markNotificationAsRead(notification1.id, admin2.id);

      // Verify it's still unread
      const updated = await prisma.notification.findUnique({
        where: { id: notification1.id },
      });

      expect(updated?.read).toBe(false);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should return only unread notifications for user', async () => {
      const admin = await createTestAdmin();

      // Create read and unread notifications
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM_ALERT',
          title: 'Read notification',
          message: 'This is read',
          read: true,
        },
      });

      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYNC_FAILURE',
          title: 'Unread notification',
          message: 'This is unread',
          read: false,
        },
      });

      const unread = await getUnreadNotifications(admin.id);

      expect(unread).toHaveLength(1);
      expect(unread[0].title).toBe('Unread notification');
    });

    it('should return notifications in descending order by creation date', async () => {
      const admin = await createTestAdmin();

      const notif1 = await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM_ALERT',
          title: 'First',
          message: 'First notification',
          read: false,
          createdAt: new Date('2024-01-01'),
        },
      });

      const notif2 = await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM_ALERT',
          title: 'Second',
          message: 'Second notification',
          read: false,
          createdAt: new Date('2024-01-02'),
        },
      });

      const unread = await getUnreadNotifications(admin.id);

      expect(unread).toHaveLength(2);
      expect(unread[0].id).toBe(notif2.id); // Most recent first
      expect(unread[1].id).toBe(notif1.id);
    });

    it('should return empty array when no unread notifications', async () => {
      const admin = await createTestAdmin();

      const unread = await getUnreadNotifications(admin.id);

      expect(unread).toHaveLength(0);
    });
  });
});
