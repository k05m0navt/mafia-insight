import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { IntegrityChecker } from '@/lib/gomafia/import/integrity-checker';

const db = new PrismaClient();

/**
 * Parse and format errors from sync log
 */
function parseSyncLogErrors(errors: unknown): {
  errorSummary?: {
    totalErrors: number;
    errorsByPhase: Record<string, number>;
    errorsByCode: Record<string, number>;
    criticalErrors: number;
    retriedErrors: number;
  };
  skippedPages?: Record<string, number[]>;
  integrity?: unknown;
  message?: string;
  errors?: Array<{
    code?: string;
    message?: string;
    phase?: string;
    context?: Record<string, unknown>;
    timestamp?: string;
    willRetry?: boolean;
  }>;
} | null {
  if (!errors || typeof errors !== 'object') {
    return null;
  }

  const errorObj = errors as Record<string, unknown>;

  return {
    message:
      typeof errorObj.message === 'string' ? errorObj.message : undefined,
    errorSummary: errorObj.errorSummary as
      | {
          totalErrors: number;
          errorsByPhase: Record<string, number>;
          errorsByCode: Record<string, number>;
          criticalErrors: number;
          retriedErrors: number;
        }
      | undefined,
    skippedPages: errorObj.skippedPages as Record<string, number[]> | undefined,
    integrity: errorObj.integrity,
    // If errors is an array, format it
    errors: Array.isArray(errorObj.errors)
      ? errorObj.errors.map((err: unknown) => {
          if (typeof err === 'string') {
            return { message: err };
          }
          if (err && typeof err === 'object') {
            const e = err as Record<string, unknown>;
            return {
              code: typeof e.code === 'string' ? e.code : undefined,
              message: typeof e.message === 'string' ? e.message : String(e),
              phase: typeof e.phase === 'string' ? e.phase : undefined,
              context: e.context as Record<string, unknown> | undefined,
              timestamp: e.timestamp ? String(e.timestamp) : undefined,
              willRetry:
                typeof e.willRetry === 'boolean' ? e.willRetry : undefined,
            };
          }
          return { message: String(err) };
        })
      : undefined,
  };
}

/**
 * GET /api/gomafia-sync/import/validation
 * Get validation metrics and data integrity status
 */
export async function GET() {
  try {
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    // Run integrity checks
    const integrityChecker = new IntegrityChecker(db);
    const integrityResults = await integrityChecker.getIntegritySummary();

    // Get latest sync log for additional details
    const latestSync = await db.syncLog.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { endTime: 'desc' },
    });

    // Also get the most recent sync log (could be FAILED or RUNNING)
    const mostRecentSync = await db.syncLog.findFirst({
      orderBy: { startTime: 'desc' },
    });

    // Parse errors from the most recent sync log
    const detailedErrors = mostRecentSync?.errors
      ? parseSyncLogErrors(mostRecentSync.errors)
      : null;

    return NextResponse.json({
      validation: {
        validationRate: syncStatus?.validationRate || null,
        totalRecordsProcessed: syncStatus?.totalRecordsProcessed || null,
        validRecords: syncStatus?.validRecords || null,
        invalidRecords: syncStatus?.invalidRecords || null,
        meetsThreshold: syncStatus?.validationRate
          ? syncStatus.validationRate >= 98
          : false,
      },
      integrity: {
        status: integrityResults.status,
        totalChecks: integrityResults.totalChecks,
        passedChecks: integrityResults.passedChecks,
        failedChecks: integrityResults.failedChecks,
        message: integrityResults.message,
        issues: integrityResults.issues || [],
      },
      lastSync: latestSync
        ? {
            id: latestSync.id,
            endTime: latestSync.endTime?.toISOString(),
            recordsProcessed: latestSync.recordsProcessed,
            errors: latestSync.errors,
          }
        : null,
      detailedErrors: detailedErrors,
      recentSyncId: mostRecentSync?.id || null,
      recentSyncStatus: mostRecentSync?.status || null,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch validation metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch validation metrics',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
