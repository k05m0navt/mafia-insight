import { prisma } from '@/lib/db';
import { sendAdminAlert } from '@/lib/email/adminAlerts';
import { Prisma } from '@prisma/client';

/**
 * Notification Service
 * Handles creation and management of in-app notifications and email alerts
 */

export interface NotificationData {
  type: 'SYNC_FAILURE' | 'SYNC_SUCCESS' | 'SYSTEM_ALERT' | 'USER_ACTION';
  title: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Create notifications for all admin users
 */
export async function createAdminNotification(
  notificationData: NotificationData
): Promise<void> {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true },
    });

    if (admins.length === 0) {
      console.warn('No admin users found to notify');
      return;
    }

    // Create in-app notification for each admin
    const notifications: Prisma.NotificationCreateManyInput[] = admins.map(
      (admin) => {
        const notification: Prisma.NotificationCreateManyInput = {
          userId: admin.id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          read: false,
        };

        if (notificationData.details) {
          notification.details =
            notificationData.details as Prisma.InputJsonValue;
        }

        return notification;
      }
    );

    await prisma.notification.createMany({
      data: notifications,
    });

    console.log(`Created ${admins.length} notifications for admins`);
  } catch (error) {
    console.error('Failed to create admin notifications:', error);
    throw error;
  }
}

/**
 * Send alerts to all admins (in-app + email)
 */
export async function sendAdminAlerts(
  notificationData: NotificationData,
  syncLogId?: string
): Promise<void> {
  try {
    // Create in-app notifications
    await createAdminNotification(notificationData);

    // Send email alerts
    await sendAdminAlert({
      type: notificationData.type as
        | 'SYNC_FAILURE'
        | 'SYNC_SUCCESS'
        | 'SYSTEM_ALERT',
      title: notificationData.title,
      message: notificationData.message,
      details: notificationData.details,
      syncLogId,
    });

    console.log('Admin alerts sent successfully');
  } catch (error) {
    console.error('Failed to send admin alerts:', error);
    // Don't throw - notifications are not critical enough to fail the sync
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return notifications;
  } catch (error) {
    console.error('Failed to fetch unread notifications:', error);
    return [];
  }
}

/**
 * Get all notifications for a user
 */
export async function getAllNotifications(userId: string, limit: number = 50) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
      data: {
        read: true,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<boolean> {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }
}

/**
 * Delete old notifications (cleanup job)
 */
export async function deleteOldNotifications(
  daysOld: number = 90
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        read: true, // Only delete read notifications
      },
    });

    console.log(`Deleted ${result.count} old notifications`);
    return result.count;
  } catch (error) {
    console.error('Failed to delete old notifications:', error);
    return 0;
  }
}
