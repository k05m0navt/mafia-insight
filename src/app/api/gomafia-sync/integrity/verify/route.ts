import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { runDataVerification } from '@/services/sync/verificationService';
import { sendAdminAlerts } from '@/services/sync/notificationService';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gomafia-sync/integrity/verify
 * Trigger manual data integrity verification (admin only)
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    console.log('[API] Starting manual data verification...');

    // Run verification
    const report = await runDataVerification('MANUAL');

    // Send alert if accuracy is below threshold
    if (report.overallAccuracy < 95) {
      await sendAdminAlerts({
        type: 'SYSTEM_ALERT',
        title: 'Data Integrity Warning',
        message: `Data verification completed with ${report.overallAccuracy.toFixed(2)}% accuracy (below 95% threshold)`,
        details: {
          overallAccuracy: report.overallAccuracy,
          status: report.status,
          playerAccuracy: report.results.players.accuracy,
          clubAccuracy: report.results.clubs.accuracy,
          tournamentAccuracy: report.results.tournaments.accuracy,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report,
      message: 'Data verification completed successfully',
    });
  } catch (error) {
    console.error('[API] Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to run data verification' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gomafia-sync/integrity/verify
 * Get latest verification status (admin only)
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get latest report
    const latestReport = await prisma.dataIntegrityReport.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!latestReport) {
      return NextResponse.json({
        message: 'No verification reports found',
        report: null,
      });
    }

    return NextResponse.json({
      report: latestReport,
    });
  } catch (error) {
    console.error('[API] Get verification error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
}
