import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/services/analyticsService';

const analyticsService = new AnalyticsService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || undefined;
    const period = searchParams.get('period') || 'all_time';

    const resolvedParams = await params;
    const analytics = await analyticsService.getPlayerAnalytics(
      resolvedParams.id,
      role,
      period
    );
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching player analytics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch player analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
