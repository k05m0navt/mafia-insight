import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { getVerificationHistory } from '@/services/sync/verificationService';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gomafia-sync/integrity/reports
 * Get verification report history (admin only)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const reports = await getVerificationHistory(limit);

    return NextResponse.json({
      reports,
      count: reports.length,
    });
  } catch (error) {
    console.error('[API] Get reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification reports' },
      { status: 500 }
    );
  }
}
