import { NextRequest, NextResponse } from 'next/server';
import { mockPlayerAnalytics } from '@/lib/test-db';

// Mock analytics API route for E2E tests
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check if player ID is valid (only player-1 is valid in our mock data)
    if (id !== 'player-1') {
      return NextResponse.json(
        {
          error: 'Player not found',
          message: 'The requested player does not exist',
        },
        { status: 404 }
      );
    }

    // Return mock analytics data
    return NextResponse.json(mockPlayerAnalytics);
  } catch (error) {
    console.error('Error fetching test player analytics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch player analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
