import { NextRequest, NextResponse } from 'next/server';
import { ClubService } from '@/services/clubService';

const clubService = new ClubService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all_time';

    const analytics = await clubService.getClubAnalytics(params.id, period);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching club analytics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch club analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
