import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { IntegrityChecker } from '@/lib/gomafia/import/integrity-checker';
import { checkApiRateLimit } from '@/lib/rateLimiter';
import { getValidationThreshold } from '@/services/validation-service';

const db = new PrismaClient();

/**
 * Get client IP address from request for rate limiting
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return ip;
}

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
 * Enhanced to return complete validation summary (Task 5: AC #3).
 *
 * Rate limiting: 100 requests per minute per IP address
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (100 requests per minute per IP)
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkApiRateLimit(
      `validation-api:${clientIp}`
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }
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

    // Extract validation metrics from sync log errors if available
    let validationMetrics: {
      validationRate: number;
      meetsThreshold: boolean;
      totalRecords: number;
      validRecords: number;
      invalidRecords: number;
      errorsByEntity: Record<string, number>;
      errors: Array<{
        entity: string;
        message: string;
        context?: Record<string, unknown>;
        timestamp: string;
      }>;
    } | null = null;

    if (mostRecentSync?.errors && typeof mostRecentSync.errors === 'object') {
      const errors = mostRecentSync.errors as Record<string, unknown>;
      const metrics = errors.validationMetrics as
        | {
            overall?: {
              validationRate: number;
              meetsThreshold: boolean;
              totalRecords: number;
              validRecords: number;
              invalidRecords: number;
              errorsByEntity: Record<string, number>;
            };
          }
        | undefined;

      if (metrics?.overall) {
        // Get recent errors from validation metrics
        const recentErrors: Array<{
          entity: string;
          message: string;
          context?: Record<string, unknown>;
          timestamp: string;
        }> = [];

        // Extract errors from each phase
        for (const [phase, phaseData] of Object.entries(
          metrics as Record<string, unknown>
        )) {
          if (
            phase !== 'overall' &&
            phaseData &&
            typeof phaseData === 'object'
          ) {
            const phaseMetrics = phaseData as {
              recentErrors?: Array<{
                entity: string;
                message: string;
                context?: Record<string, unknown>;
                timestamp: Date | string;
              }>;
            };
            if (phaseMetrics.recentErrors) {
              recentErrors.push(
                ...phaseMetrics.recentErrors.map((err) => ({
                  entity: err.entity,
                  message: err.message,
                  context: err.context,
                  timestamp:
                    typeof err.timestamp === 'string'
                      ? err.timestamp
                      : err.timestamp instanceof Date
                        ? err.timestamp.toISOString()
                        : new Date().toISOString(),
                }))
              );
            }
          }
        }

        // Sort by timestamp (most recent first) and take last 50
        recentErrors.sort((a, b) => {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA;
        });

        validationMetrics = {
          validationRate: metrics.overall.validationRate,
          meetsThreshold: metrics.overall.meetsThreshold,
          totalRecords: metrics.overall.totalRecords,
          validRecords: metrics.overall.validRecords,
          invalidRecords: metrics.overall.invalidRecords,
          errorsByEntity: metrics.overall.errorsByEntity,
          errors: recentErrors.slice(0, 50), // Last 50 errors
        };
      }
    }

    // Fallback to syncStatus if validation metrics not in sync log
    if (!validationMetrics && syncStatus) {
      const threshold = getValidationThreshold();
      const validationRate = syncStatus.validationRate || 0;
      validationMetrics = {
        validationRate,
        meetsThreshold: validationRate >= threshold,
        totalRecords: syncStatus.totalRecordsProcessed || 0,
        validRecords: syncStatus.validRecords || 0,
        invalidRecords: syncStatus.invalidRecords || 0,
        errorsByEntity: {},
        errors: [],
      };
    }

    return NextResponse.json({
      validationRate: validationMetrics?.validationRate ?? null,
      meetsThreshold: validationMetrics?.meetsThreshold ?? false,
      totalRecords: validationMetrics?.totalRecords ?? null,
      validRecords: validationMetrics?.validRecords ?? null,
      invalidRecords: validationMetrics?.invalidRecords ?? null,
      errorsByEntity: validationMetrics?.errorsByEntity ?? {},
      errors: validationMetrics?.errors ?? [],
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
