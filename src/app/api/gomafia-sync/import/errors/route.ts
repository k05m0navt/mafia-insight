import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { authenticateRequest } from '@/lib/apiAuth';
import { ErrorSummary } from '@/lib/gomafia/import/error-summary-tracker';

/**
 * GET /api/gomafia-sync/import/errors
 * Get error summary from the latest import sync log
 * Returns error summary with grouping by type for easier debugging
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    await authenticateRequest(request);

    // Get the latest sync log
    const latestSyncLog = await db.syncLog.findFirst({
      where: {
        // Optionally filter by user if needed
      },
      orderBy: {
        startTime: 'desc',
      },
      select: {
        id: true,
        errors: true,
        status: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!latestSyncLog) {
      return NextResponse.json(
        {
          error: 'No sync log found',
          code: 'NO_SYNC_LOG',
          errorSummary: null,
        },
        { status: 404 }
      );
    }

    // Extract error summary from SyncLog.errors
    let errorSummary: ErrorSummary | null = null;

    if (latestSyncLog.errors && typeof latestSyncLog.errors === 'object') {
      const errors = latestSyncLog.errors as Record<string, unknown>;

      // Check if errorSummary exists in the errors object
      if (errors.errorSummary && typeof errors.errorSummary === 'object') {
        errorSummary = errors.errorSummary as ErrorSummary;
      }
    }

    // If no error summary, return empty structure
    if (!errorSummary) {
      return NextResponse.json({
        syncLogId: latestSyncLog.id,
        status: latestSyncLog.status,
        startTime: latestSyncLog.startTime.toISOString(),
        endTime: latestSyncLog.endTime?.toISOString() || null,
        errorSummary: {
          totalErrors: 0,
          errorsByCategory: {
            transient: 0,
            permanent: 0,
          },
          errorsByType: {},
          skippedEntitiesByPhase: {},
          recentErrors: [],
        },
        message: 'No errors found in sync log',
      });
    }

    // Group errors by type for easier debugging
    const errorsByTypeGrouped: Record<string, number> = {};
    for (const [type, count] of Object.entries(errorSummary.errorsByType)) {
      errorsByTypeGrouped[type] = count;
    }

    const response = NextResponse.json({
      syncLogId: latestSyncLog.id,
      status: latestSyncLog.status,
      startTime: latestSyncLog.startTime.toISOString(),
      endTime: latestSyncLog.endTime?.toISOString() || null,
      errorSummary: {
        totalErrors: errorSummary.totalErrors,
        errorsByCategory: errorSummary.errorsByCategory,
        errorsByType: errorsByTypeGrouped,
        skippedEntitiesByPhase: errorSummary.skippedEntitiesByPhase,
        recentErrors: errorSummary.recentErrors, // Already limited to 50 by ErrorSummaryTracker
      },
      message:
        errorSummary.totalErrors > 0
          ? `Import completed with ${errorSummary.totalErrors} error${
              errorSummary.totalErrors !== 1 ? 's' : ''
            }. ${Object.values(errorSummary.skippedEntitiesByPhase).reduce(
              (sum, count) => sum + count,
              0
            )} entit${
              Object.values(errorSummary.skippedEntitiesByPhase).reduce(
                (sum, count) => sum + count,
                0
              ) !== 1
                ? 'ies'
                : 'y'
            } skipped.`
          : 'Import completed successfully with no errors.',
    });

    // Prevent caching to ensure fresh data
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: unknown) {
    console.error('Failed to fetch error summary:', error);

    // Handle authentication errors
    if (
      error instanceof Error &&
      (error.message.includes('Authentication') ||
        error.message.includes('required'))
    ) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch error summary',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
