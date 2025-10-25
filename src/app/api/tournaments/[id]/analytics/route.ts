import { NextRequest, NextResponse } from 'next/server';
import { TournamentService } from '@/services/tournamentService';

const tournamentService = new TournamentService();

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analytics = await tournamentService.getTournamentAnalytics(params.id);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching tournament analytics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tournament analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
