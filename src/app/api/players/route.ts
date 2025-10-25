import { NextRequest, NextResponse } from 'next/server';
import { PlayerService } from '@/services/playerService';

const playerService = new PlayerService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const clubId = searchParams.get('club_id') || undefined;

    const result = await playerService.getPlayers(page, limit, search, clubId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch players',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...playerData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const player = await playerService.createPlayer(playerData, userId);

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create player',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
