import { Resend } from 'resend';
import { prisma } from '@/lib/db';

/**
 * Admin Email Alert Service
 * Sends email notifications to administrators for sync failures and system alerts
 */

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface EmailAlertOptions {
  type: 'SYNC_FAILURE' | 'SYNC_SUCCESS' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  details?: Record<string, unknown>;
  syncLogId?: string;
  notificationId?: string;
}

/**
 * Get all admin user emails
 */
async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { email: true },
  });

  return admins.map((admin) => admin.email);
}

/**
 * Send email alert to all administrators
 * @param options - Alert configuration options
 * @returns Success status and email log ID
 */
export async function sendAdminAlert(options: EmailAlertOptions): Promise<{
  success: boolean;
  emailLogId?: string;
  error?: string;
}> {
  try {
    // Get all admin emails
    const adminEmails = await getAdminEmails();

    if (adminEmails.length === 0) {
      console.warn('No admin users found to send alert');
      return { success: false, error: 'No admin users found' };
    }

    // Build email subject
    const subject = `[Mafia Insight] ${options.title}`;

    // Build email HTML content
    const htmlContent = buildEmailHtml(options);

    // Send email via Resend
    const resendClient = getResendClient();
    if (!resendClient) {
      return {
        success: false,
        emailLogId: undefined,
        error: 'Resend client not initialized (missing API key)',
      };
    }

    const { error: resendError } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'alerts@mafiainsight.com',
      to: adminEmails,
      subject,
      html: htmlContent,
    });

    // Log email send attempt
    const emailLog = await prisma.emailLog.create({
      data: {
        to: adminEmails,
        subject,
        type: options.type,
        status: resendError ? 'FAILED' : 'SENT',
        sentAt: resendError ? null : new Date(),
        error: resendError?.message,
        metadata: options.details
          ? {
              syncLogId: options.syncLogId,
              notificationId: options.notificationId,
              ...options.details,
            }
          : undefined,
      },
    });

    if (resendError) {
      console.error('Failed to send admin alert email:', resendError);
      return {
        success: false,
        emailLogId: emailLog.id,
        error: resendError.message,
      };
    }

    console.log(
      `Admin alert sent successfully to ${adminEmails.length} admins`
    );
    return {
      success: true,
      emailLogId: emailLog.id,
    };
  } catch (error) {
    console.error('Unexpected error sending admin alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send sync failure alert
 * @param syncLog - Sync log details
 */
export async function sendSyncFailureAlert(syncLog: {
  id: string;
  startTime: Date;
  errors?: unknown;
  recordsProcessed?: number | null;
}): Promise<void> {
  const errorDetails = syncLog.errors
    ? JSON.stringify(syncLog.errors, null, 2)
    : 'No error details available';

  await sendAdminAlert({
    type: 'SYNC_FAILURE',
    title: 'Data Synchronization Failed',
    message: `The scheduled data sync from gomafia.pro failed at ${syncLog.startTime.toISOString()}.`,
    details: {
      syncLogId: syncLog.id,
      startTime: syncLog.startTime,
      recordsProcessed: syncLog.recordsProcessed || 0,
      errors: errorDetails,
    },
    syncLogId: syncLog.id,
  });
}

/**
 * Send sync success alert (optional, can be disabled by default)
 * @param syncLog - Sync log details
 */
export async function sendSyncSuccessAlert(syncLog: {
  id: string;
  startTime: Date;
  endTime?: Date | null;
  recordsProcessed?: number | null;
}): Promise<void> {
  const duration = syncLog.endTime
    ? Math.round(
        (syncLog.endTime.getTime() - syncLog.startTime.getTime()) / 1000 / 60
      )
    : 0;

  await sendAdminAlert({
    type: 'SYNC_SUCCESS',
    title: 'Data Synchronization Completed',
    message: `The scheduled data sync completed successfully in ${duration} minutes.`,
    details: {
      syncLogId: syncLog.id,
      startTime: syncLog.startTime,
      endTime: syncLog.endTime,
      recordsProcessed: syncLog.recordsProcessed || 0,
      duration: `${duration} minutes`,
    },
    syncLogId: syncLog.id,
  });
}

/**
 * Retry failed email send
 * @param emailLogId - Email log ID to retry
 * @returns Success status
 */
export async function retryEmailSend(emailLogId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get email log
    const emailLog = await prisma.emailLog.findUnique({
      where: { id: emailLogId },
    });

    if (!emailLog) {
      return { success: false, error: 'Email log not found' };
    }

    // Check retry count
    if (emailLog.retryCount >= 3) {
      return { success: false, error: 'Maximum retry attempts exceeded' };
    }

    // Retry sending
    const resendClient = getResendClient();
    if (!resendClient) {
      return { success: false, error: 'Resend client not initialized' };
    }

    const { error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'alerts@mafiainsight.com',
      to: emailLog.to,
      subject: emailLog.subject,
      html: buildEmailHtmlFromLog(emailLog),
    });

    // Update email log
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: error ? 'FAILED' : 'SENT',
        sentAt: error ? null : new Date(),
        error: error?.message,
        retryCount: emailLog.retryCount + 1,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error retrying email send:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build email HTML content
 */
function buildEmailHtml(options: EmailAlertOptions): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const detailsHtml = options.details
    ? `
    <h3>Details:</h3>
    <ul>
      ${Object.entries(options.details)
        .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
        .join('')}
    </ul>
  `
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          h2 {
            color: ${options.type === 'SYNC_FAILURE' ? '#dc2626' : options.type === 'SYNC_SUCCESS' ? '#16a34a' : '#eab308'};
          }
          .message {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
          ul {
            list-style: none;
            padding: 0;
          }
          li {
            padding: 5px 0;
          }
        </style>
      </head>
      <body>
        <h2>${options.title}</h2>
        <div class="message">
          <p>${options.message}</p>
        </div>
        ${detailsHtml}
        <p>
          <a href="${appUrl}/admin/sync" class="button">View Sync Status</a>
        </p>
        <hr style="margin-top: 40px; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated alert from Mafia Insight. You are receiving this email because you are an administrator.
        </p>
      </body>
    </html>
  `;
}

/**
 * Build email HTML from email log (for retries)
 */
function buildEmailHtmlFromLog(emailLog: {
  subject: string;
  type: string;
  metadata?: unknown;
}): string {
  const metadata = emailLog.metadata as Record<string, unknown> | undefined;

  return buildEmailHtml({
    type: emailLog.type as EmailAlertOptions['type'],
    title: emailLog.subject.replace('[Mafia Insight] ', ''),
    message: 'Retry attempt for previously failed email.',
    details: metadata,
  });
}
