import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/services/analyticsService';

const analyticsService = new AnalyticsService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'players' | 'clubs';
    const role = searchParams.get('role') || undefined;
    const period = searchParams.get('period') || 'all_time';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!type || !['players', 'clubs'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "players" or "clubs"' },
        { status: 400 }
      );
    }

    const leaderboard = await analyticsService.getLeaderboard(
      type,
      role,
      period,
      limit
    );
    return NextResponse.json({ data: leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
