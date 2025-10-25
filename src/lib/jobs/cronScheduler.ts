import { CronJob } from 'cron';
import { runSync } from './syncJob';
import { logSyncError } from '@/lib/errorTracking/syncErrors';

// Configuration
const CRON_SCHEDULE = process.env.SYNC_CRON_SCHEDULE || '0 0 * * *'; // Daily at midnight UTC
const SYNC_TYPE = process.env.SYNC_TYPE || 'INCREMENTAL';

// Global cron job instance
let syncCronJob: CronJob | null = null;

// Initialize the cron scheduler
export function initializeCronScheduler(): void {
  if (syncCronJob) {
    console.log('Cron scheduler already initialized');
    return;
  }

  console.log(`Initializing cron scheduler with schedule: ${CRON_SCHEDULE}`);

  syncCronJob = new CronJob(
    CRON_SCHEDULE,
    async () => {
      console.log('Starting scheduled sync job...');

      try {
        const result = await runSync({
          type: SYNC_TYPE as 'FULL' | 'INCREMENTAL',
        });

        if (result.success) {
          console.log(
            `Scheduled sync completed successfully. Processed ${result.recordsProcessed} records in ${result.duration}ms`
          );
        } else {
          console.error(
            `Scheduled sync failed. Errors: ${result.errors.join(', ')}`
          );
          await logSyncError(
            'cron_scheduler',
            `Scheduled sync failed: ${result.errors.join(', ')}`,
            { result }
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(`Scheduled sync error: ${errorMessage}`);
        await logSyncError(
          'cron_scheduler',
          `Scheduled sync error: ${errorMessage}`,
          { error }
        );
      }
    },
    null,
    true, // Start immediately
    'UTC'
  );

  console.log('Cron scheduler initialized and started');
}

// Stop the cron scheduler
export function stopCronScheduler(): void {
  if (syncCronJob) {
    syncCronJob.stop();
    syncCronJob = null;
    console.log('Cron scheduler stopped');
  }
}

// Get cron scheduler status
export function getCronSchedulerStatus(): {
  isRunning: boolean;
  nextRun: Date | null;
  schedule: string;
} {
  if (!syncCronJob) {
    return {
      isRunning: false,
      nextRun: null,
      schedule: CRON_SCHEDULE,
    };
  }

  return {
    isRunning: syncCronJob.running,
    nextRun: syncCronJob.nextDate().toDate(),
    schedule: CRON_SCHEDULE,
  };
}

// Manually trigger sync (for testing or manual execution)
export async function triggerManualSync(
  type: 'FULL' | 'INCREMENTAL' = 'INCREMENTAL'
): Promise<{
  success: boolean;
  message: string;
  result?: { recordsProcessed: number; errors: string[] };
}> {
  try {
    console.log(`Manually triggering ${type} sync...`);

    const result = await runSync({ type });

    if (result.success) {
      return {
        success: true,
        message: `Manual ${type} sync completed successfully. Processed ${result.recordsProcessed} records in ${result.duration}ms`,
        result,
      };
    } else {
      return {
        success: false,
        message: `Manual ${type} sync failed. Errors: ${result.errors.join(', ')}`,
        result,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`Manual sync error: ${errorMessage}`);

    await logSyncError('manual_sync', `Manual sync error: ${errorMessage}`, {
      error,
      type,
    });

    return {
      success: false,
      message: `Manual sync error: ${errorMessage}`,
    };
  }
}

// Update cron schedule
export function updateCronSchedule(newSchedule: string): boolean {
  try {
    // Stop current scheduler
    stopCronScheduler();

    // Update environment variable
    process.env.SYNC_CRON_SCHEDULE = newSchedule;

    // Restart with new schedule
    initializeCronScheduler();

    console.log(`Cron schedule updated to: ${newSchedule}`);
    return true;
  } catch (error) {
    console.error(`Failed to update cron schedule: ${error}`);
    return false;
  }
}

// Get cron schedule information
export function getCronScheduleInfo(): {
  schedule: string;
  description: string;
  nextRun: Date | null;
  isRunning: boolean;
} {
  const status = getCronSchedulerStatus();

  // Parse cron expression to human-readable description
  const description = parseCronExpression(CRON_SCHEDULE);

  return {
    schedule: CRON_SCHEDULE,
    description,
    nextRun: status.nextRun,
    isRunning: status.isRunning,
  };
}

// Parse cron expression to human-readable description
function parseCronExpression(cronExpr: string): string {
  const parts = cronExpr.split(' ');

  if (parts.length !== 5) {
    return 'Invalid cron expression';
  }

  const [minute, hour, day, month, weekday] = parts;

  // Handle common patterns
  if (
    minute === '0' &&
    hour === '0' &&
    day === '*' &&
    month === '*' &&
    weekday === '*'
  ) {
    return 'Daily at midnight UTC';
  }

  if (
    minute === '0' &&
    hour === '0' &&
    day === '1' &&
    month === '*' &&
    weekday === '*'
  ) {
    return 'Monthly on the 1st at midnight UTC';
  }

  if (
    minute === '0' &&
    hour === '0' &&
    day === '*' &&
    month === '*' &&
    weekday === '0'
  ) {
    return 'Weekly on Sunday at midnight UTC';
  }

  if (
    minute === '0' &&
    hour === '0' &&
    day === '*' &&
    month === '*' &&
    weekday === '1'
  ) {
    return 'Weekly on Monday at midnight UTC';
  }

  // Handle specific hours
  if (
    minute === '0' &&
    hour !== '*' &&
    day === '*' &&
    month === '*' &&
    weekday === '*'
  ) {
    return `Daily at ${hour}:00 UTC`;
  }

  // Handle specific minutes
  if (
    minute !== '*' &&
    hour !== '*' &&
    day === '*' &&
    month === '*' &&
    weekday === '*'
  ) {
    return `Daily at ${hour}:${minute} UTC`;
  }

  return `Custom schedule: ${cronExpr}`;
}

// Health check for cron scheduler
export function getCronSchedulerHealth(): {
  healthy: boolean;
  status: string;
  message: string;
  nextRun: Date | null;
} {
  const status = getCronSchedulerStatus();

  if (!status.isRunning) {
    return {
      healthy: false,
      status: 'STOPPED',
      message: 'Cron scheduler is not running',
      nextRun: null,
    };
  }

  if (!status.nextRun) {
    return {
      healthy: false,
      status: 'NO_NEXT_RUN',
      message: 'Cron scheduler is running but no next run scheduled',
      nextRun: null,
    };
  }

  const timeUntilNextRun = status.nextRun.getTime() - Date.now();
  const hoursUntilNextRun = timeUntilNextRun / (1000 * 60 * 60);

  if (hoursUntilNextRun < 0) {
    return {
      healthy: false,
      status: 'OVERDUE',
      message: 'Cron scheduler is overdue for next run',
      nextRun: status.nextRun,
    };
  }

  return {
    healthy: true,
    status: 'HEALTHY',
    message: `Next run in ${Math.round(hoursUntilNextRun * 100) / 100} hours`,
    nextRun: status.nextRun,
  };
}

// Initialize scheduler on module load
if (process.env.NODE_ENV !== 'test') {
  initializeCronScheduler();
}
