import { resilientDB } from '@/lib/db-resilient';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SyncNotificationData {
  userId: string;
  success: boolean;
  gamesImported: number;
  gamesUpdated: number;
  errors: number;
  errorMessages?: string[];
  syncType: 'FULL' | 'INCREMENTAL';
  startTime: Date;
  endTime: Date;
}

/**
 * Send email notification when sync completes (optional, based on user preference)
 * Includes sync summary in notification (games imported, errors encountered)
 */
export async function sendSyncCompletionNotification(
  data: SyncNotificationData
): Promise<void> {
  try {
    // Get user preferences
    const user = await resilientDB.execute<{
      email: string;
      name: string;
      emailNotifications: boolean;
    } | null>((db) =>
      db.user.findUnique({
        where: { id: data.userId },
        select: {
          email: true,
          name: true,
          emailNotifications: true,
        },
      })
    );

    if (!user) {
      console.warn(`[Sync Notification] User ${data.userId} not found`);
      return;
    }

    // Respect emailNotifications preference
    if (!user.emailNotifications) {
      console.log(
        `[Sync Notification] Email notifications disabled for user ${data.userId}`
      );
      return;
    }

    // If no API key is configured, log the email instead (for development)
    if (!process.env.RESEND_API_KEY) {
      console.log(
        '[Sync Notification] Email notification (RESEND_API_KEY not configured):',
        {
          to: user.email,
          data,
        }
      );
      return;
    }

    const duration = Math.round(
      (data.endTime.getTime() - data.startTime.getTime()) / 1000 / 60
    ); // Duration in minutes

    const subject = data.success
      ? `Sync Completed Successfully - ${data.gamesImported + data.gamesUpdated} games processed`
      : `Sync Completed with Errors - ${data.errors} errors encountered`;

    const statusColor = data.success ? '#10b981' : '#ef4444';
    const statusBg = data.success ? '#d1fae5' : '#fee2e2';
    const statusText = data.success ? '#065f46' : '#991b1b';

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@mafia-insight.com',
      to: user.email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sync ${data.success ? 'Completed' : 'Completed with Errors'}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: ${statusBg}; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid ${statusColor};">
              <h1 style="color: ${statusText}; margin-top: 0; font-size: 24px; font-weight: 600;">
                ${data.success ? '✓ Sync Completed Successfully' : '⚠ Sync Completed with Errors'}
              </h1>
              <p style="color: ${statusText}; margin-bottom: 0;">
                Your ${data.syncType.toLowerCase()} sync from gomafia.pro has completed.
              </p>
            </div>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #111827; margin-top: 0; font-size: 18px; font-weight: 600; margin-bottom: 16px;">
                Sync Summary
              </h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div style="background-color: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">
                    Games Imported
                  </div>
                  <div style="color: #111827; font-size: 24px; font-weight: 700;">
                    ${data.gamesImported}
                  </div>
                </div>
                
                <div style="background-color: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">
                    Games Updated
                  </div>
                  <div style="color: #111827; font-size: 24px; font-weight: 700;">
                    ${data.gamesUpdated}
                  </div>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="background-color: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">
                    Errors
                  </div>
                  <div style="color: ${data.errors > 0 ? '#ef4444' : '#10b981'}; font-size: 24px; font-weight: 700;">
                    ${data.errors}
                  </div>
                </div>
                
                <div style="background-color: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">
                    Duration
                  </div>
                  <div style="color: #111827; font-size: 24px; font-weight: 700;">
                    ${duration}m
                  </div>
                </div>
              </div>
            </div>
            
            ${
              data.errors > 0 &&
              data.errorMessages &&
              data.errorMessages.length > 0
                ? `
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #fbbf24;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 16px; font-weight: 600; margin-bottom: 12px;">
                  Errors Encountered
                </h3>
                <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px;">
                  ${data.errorMessages
                    .slice(0, 5)
                    .map((msg) => `<li style="margin-bottom: 8px;">${msg}</li>`)
                    .join('')}
                  ${data.errorMessages.length > 5 ? `<li style="margin-bottom: 8px;">... and ${data.errorMessages.length - 5} more errors</li>` : ''}
                </ul>
              </div>
            `
                : ''
            }
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>Sync Type:</strong> ${data.syncType}<br>
                <strong>Started:</strong> ${data.startTime.toLocaleString()}<br>
                <strong>Completed:</strong> ${data.endTime.toLocaleString()}
              </p>
            </div>
            
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You can view detailed sync logs and manage your sync preferences in your account settings.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Sync ${data.success ? 'Completed Successfully' : 'Completed with Errors'}

Your ${data.syncType.toLowerCase()} sync from gomafia.pro has completed.

Sync Summary:
- Games Imported: ${data.gamesImported}
- Games Updated: ${data.gamesUpdated}
- Errors: ${data.errors}
- Duration: ${duration} minutes

${
  data.errors > 0 && data.errorMessages && data.errorMessages.length > 0
    ? `
Errors Encountered:
${data.errorMessages
  .slice(0, 5)
  .map((msg, i) => `${i + 1}. ${msg}`)
  .join('\n')}
${data.errorMessages.length > 5 ? `... and ${data.errorMessages.length - 5} more errors` : ''}
`
    : ''
}

Sync Type: ${data.syncType}
Started: ${data.startTime.toLocaleString()}
Completed: ${data.endTime.toLocaleString()}

You can view detailed sync logs and manage your sync preferences in your account settings.
      `,
    });

    console.log(`[Sync Notification] Email sent to ${user.email}`);
  } catch (error) {
    console.error('[Sync Notification] Failed to send email:', error);
    // Don't throw - notification failure shouldn't break the sync
  }
}
