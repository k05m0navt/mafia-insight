import cron from 'cron';

export interface CronJobConfig {
  schedule: string;
  enabled: boolean;
  name: string;
}

/**
 * Get cron schedule from environment variable
 * Default: "0 0 * * *" (daily at midnight UTC)
 */
export function getCronSchedule(): string {
  return process.env.SYNC_CRON_SCHEDULE || '0 0 * * *';
}

/**
 * Validate cron schedule format
 */
export function validateCronSchedule(schedule: string): boolean {
  try {
    // Basic validation - check for 5 or 6 space-separated fields
    const parts = schedule.trim().split(/\s+/);
    return parts.length === 5 || parts.length === 6;
  } catch {
    return false;
  }
}

/**
 * Create a cron job
 */
export function createCronJob(
  name: string,
  schedule: string,
  onTick: () => void | Promise<void>
): cron.CronJob {
  const isValidSchedule = validateCronSchedule(schedule);

  if (!isValidSchedule) {
    throw new Error(`Invalid cron schedule: ${schedule}`);
  }

  const job = new cron.CronJob(
    schedule,
    async () => {
      try {
        console.log(`[Cron] ${name} started`);
        await onTick();
        console.log(`[Cron] ${name} completed`);
      } catch (error) {
        console.error(`[Cron] ${name} failed:`, error);
      }
    },
    null, // onComplete
    false, // start
    'UTC' // timeZone
  );

  return job;
}

/**
 * Sync job configuration
 */
export const syncJobConfig: CronJobConfig = {
  schedule: getCronSchedule(),
  enabled: process.env.SYNC_ENABLED !== 'false',
  name: 'Gomafia Data Sync',
};

/**
 * Start sync cron job if enabled
 */
export async function startSyncCronJob(
  onSync: () => Promise<void>
): Promise<cron.CronJob | null> {
  if (!syncJobConfig.enabled) {
    console.log('[Cron] Sync job is disabled');
    return null;
  }

  const job = createCronJob(syncJobConfig.name, syncJobConfig.schedule, onSync);

  console.log(
    `[Cron] Starting ${syncJobConfig.name} with schedule: ${syncJobConfig.schedule}`
  );
  job.start();

  return job;
}

/**
 * Stop a cron job
 */
export function stopCronJob(job: cron.CronJob | null): void {
  if (job) {
    job.stop();
    console.log('[Cron] Job stopped');
  }
}
