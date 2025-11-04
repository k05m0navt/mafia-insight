import { NextRequest, NextResponse } from 'next/server';
import { mockPlayers } from '@/lib/test-db';

// Mock API route for E2E tests - gated in production
export async function GET(request: NextRequest) {
  // Gate test routes in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const clubId = searchParams.get('club_id') || undefined;

    // Add delay for loading state test
    if (search === 'loading-test') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Filter players based on search, club, and role
    let filteredPlayers = mockPlayers;

    if (search) {
      filteredPlayers = filteredPlayers.filter((player) =>
        player.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (clubId) {
      filteredPlayers = filteredPlayers.filter(
        (player) => player.clubId === clubId
      );
    }

    // Filter by role if specified
    const role = searchParams.get('role');
    if (role) {
      filteredPlayers = filteredPlayers.filter((player) =>
        player.roleStats.some((stat) => stat.role === role)
      );
    }

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);

    const result = {
      data: paginatedPlayers,
      pagination: {
        page,
        limit,
        total: filteredPlayers.length,
        pages: Math.ceil(filteredPlayers.length / limit),
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching test players:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch players',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
