import { ErrorSchema } from '../validations/syncSchemas';

export type Error = {
  message: string;
  code?: string;
  timestamp?: string;
  details?: Record<string, string | number | boolean | null>;
};
import { db } from '@/lib/db';

export interface SyncError extends Error {
  code?: string;
  details?: Record<string, string | number | boolean | null>;
}

/**
 * Create an error object from an exception
 */
export function createError(error: unknown): Error {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as SyncError).code,
      timestamp: new Date().toISOString(),
      details: (error as SyncError).details,
    };
  }

  return {
    message: String(error),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log sync error with structured logging
 */
export async function logSyncError(
  operation: string,
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  const errorObject = createError(error);

  console.error('[Sync Error]', {
    operation,
    ...errorObject,
    ...context,
  });

  // Log to database
  try {
    await db.syncLog.create({
      data: {
        type: 'INCREMENTAL', // Default type
        status: 'FAILED',
        startTime: new Date(),
        endTime: new Date(),
        errors: [errorObject],
      },
    });
  } catch (dbError) {
    console.error('[Sync Error] Failed to log to database:', dbError);
  }

  // TODO: Integrate with error tracking service (e.g., Sentry)
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Handle sync errors and return error array
 */
export function handleSyncErrors(errors: unknown[]): Error[] {
  return errors.map(createError);
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = parseInt(process.env.SYNC_MAX_RETRIES || '5'),
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(
          `[Sync] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Validate error object
 */
export function validateError(error: unknown): error is Error {
  try {
    ErrorSchema.parse(error);
    return true;
  } catch {
    return false;
  }
}
