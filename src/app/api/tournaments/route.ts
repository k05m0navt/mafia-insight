import { NextRequest, NextResponse } from 'next/server';
import { TournamentService } from '@/services/tournamentService';

const tournamentService = new TournamentService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const result = await tournamentService.getTournaments(
      page,
      limit,
      search,
      status
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tournaments',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...tournamentData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const tournament = await tournamentService.createTournament(
      tournamentData,
      userId
    );

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create tournament',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
