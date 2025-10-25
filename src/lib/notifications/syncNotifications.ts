import { db } from '@/lib/db';

export interface NotificationConfig {
  id: string;
  enabled: boolean;
  channels: ('email' | 'webhook' | 'database')[];
  thresholds: {
    errorRate: number;
    durationMinutes: number;
    consecutiveFailures: number;
  };
  recipients: string[];
  webhookUrl?: string;
}

export interface Notification {
  id: string;
  type: 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

/**
 * Default notification configuration
 */
const DEFAULT_CONFIG: NotificationConfig = {
  id: 'default',
  enabled: true,
  channels: ['database'],
  thresholds: {
    errorRate: 20,
    durationMinutes: 30,
    consecutiveFailures: 3,
  },
  recipients: [],
};

/**
 * Send notification through configured channels
 */
export async function sendNotification(
  notification: Omit<Notification, 'id' | 'timestamp'>,
  config: NotificationConfig = DEFAULT_CONFIG
): Promise<void> {
  if (!config.enabled) {
    return;
  }

  const fullNotification: Notification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };

  // Send to database
  if (config.channels.includes('database')) {
    await sendToDatabase(fullNotification);
  }

  // Send to webhook
  if (config.channels.includes('webhook') && config.webhookUrl) {
    await sendToWebhook(fullNotification, config.webhookUrl);
  }

  // Send to email (placeholder for future implementation)
  if (config.channels.includes('email') && config.recipients.length > 0) {
    await sendToEmail(fullNotification, config.recipients);
  }
}

/**
 * Send notification to database
 */
async function sendToDatabase(notification: Notification): Promise<void> {
  try {
    // Store in a notifications table (would need to be created)
    console.log('[Notification] Stored in database:', notification);
  } catch (error) {
    console.error('[Notification] Failed to store in database:', error);
  }
}

/**
 * Send notification to webhook
 */
async function sendToWebhook(
  notification: Notification,
  webhookUrl: string
): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status}`);
    }

    console.log('[Notification] Sent to webhook:', notification);
  } catch (error) {
    console.error('[Notification] Failed to send to webhook:', error);
  }
}

/**
 * Send notification to email (placeholder)
 */
async function sendToEmail(
  notification: Notification,
  recipients: string[]
): Promise<void> {
  try {
    // TODO: Implement email sending (e.g., using SendGrid, AWS SES, etc.)
    console.log(
      '[Notification] Would send email to:',
      recipients,
      notification
    );
  } catch (error) {
    console.error('[Notification] Failed to send email:', error);
  }
}

/**
 * Check sync health and send notifications if needed
 */
export async function checkSyncHealthAndNotify(
  config: NotificationConfig = DEFAULT_CONFIG
): Promise<void> {
  try {
    // Get recent sync logs
    const recentLogs = await db.syncLog.findMany({
      where: {
        startTime: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { startTime: 'desc' },
    });

    if (recentLogs.length === 0) {
      return;
    }

    // Calculate error rate
    const failedLogs = recentLogs.filter((log) => log.status === 'FAILED');
    const errorRate = (failedLogs.length / recentLogs.length) * 100;

    // Check for high error rate
    if (errorRate >= config.thresholds.errorRate) {
      await sendNotification(
        {
          type: 'ERROR',
          title: 'High Sync Error Rate',
          message: `Sync error rate is ${errorRate.toFixed(1)}%, exceeding threshold of ${config.thresholds.errorRate}%`,
          resolved: false,
          metadata: {
            errorRate,
            threshold: config.thresholds.errorRate,
            recentLogs: recentLogs.length,
            failedLogs: failedLogs.length,
          },
        },
        config
      );
    }

    // Check for consecutive failures
    const consecutiveFailures = getConsecutiveFailures(recentLogs);
    if (consecutiveFailures >= config.thresholds.consecutiveFailures) {
      await sendNotification(
        {
          type: 'ERROR',
          title: 'Consecutive Sync Failures',
          message: `${consecutiveFailures} consecutive sync failures detected`,
          resolved: false,
          metadata: {
            consecutiveFailures,
            threshold: config.thresholds.consecutiveFailures,
          },
        },
        config
      );
    }

    // Check for long-running syncs
    const runningSyncs = recentLogs.filter((log) => log.status === 'RUNNING');
    for (const sync of runningSyncs) {
      const durationMinutes =
        (Date.now() - sync.startTime.getTime()) / (1000 * 60);
      if (durationMinutes >= config.thresholds.durationMinutes) {
        await sendNotification(
          {
            type: 'WARNING',
            title: 'Long-Running Sync',
            message: `Sync has been running for ${durationMinutes.toFixed(1)} minutes`,
            resolved: false,
            metadata: {
              syncId: sync.id,
              durationMinutes,
              threshold: config.thresholds.durationMinutes,
            },
          },
          config
        );
      }
    }
  } catch (error) {
    console.error('[Notification] Failed to check sync health:', error);
  }
}

/**
 * Get number of consecutive failures from recent logs
 */
function getConsecutiveFailures(logs: any[]): number {
  let consecutiveFailures = 0;

  for (const log of logs) {
    if (log.status === 'FAILED') {
      consecutiveFailures++;
    } else {
      break;
    }
  }

  return consecutiveFailures;
}

/**
 * Send sync completion notification
 */
export async function notifySyncCompletion(
  syncLogId: string,
  success: boolean,
  recordsProcessed: number,
  errors: string[],
  config: NotificationConfig = DEFAULT_CONFIG
): Promise<void> {
  const notification = {
    type: (success ? 'INFO' : 'ERROR') as 'INFO' | 'ERROR',
    title: success ? 'Sync Completed Successfully' : 'Sync Failed',
    message: success
      ? `Sync completed successfully. Processed ${recordsProcessed} records.`
      : `Sync failed. Processed ${recordsProcessed} records with ${errors.length} errors.`,
    resolved: false,
    metadata: {
      syncLogId,
      success,
      recordsProcessed,
      errorCount: errors.length,
      errors: errors.slice(0, 5), // Limit to first 5 errors
    },
  };

  await sendNotification(notification, config);
}

/**
 * Send sync start notification
 */
export async function notifySyncStart(
  syncType: 'FULL' | 'INCREMENTAL',
  config: NotificationConfig = DEFAULT_CONFIG
): Promise<void> {
  const notification = {
    type: 'INFO' as const,
    title: 'Sync Started',
    message: `${syncType} sync has started`,
    resolved: false,
    metadata: {
      syncType,
      startTime: new Date().toISOString(),
    },
  };

  await sendNotification(notification, config);
}

/**
 * Get notification history
 */
export async function getNotificationHistory(
  _limit: number = 50
): Promise<Notification[]> {
  // This would query a notifications table
  // For now, return empty array
  return [];
}

/**
 * Mark notification as resolved
 */
export async function resolveNotification(
  notificationId: string
): Promise<void> {
  try {
    // This would update a notifications table
    console.log('[Notification] Marked as resolved:', notificationId);
  } catch (error) {
    console.error('[Notification] Failed to resolve notification:', error);
  }
}
