import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { IntegrityChecker } from '@/lib/gomafia/import/integrity-checker';

const db = new PrismaClient();

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
