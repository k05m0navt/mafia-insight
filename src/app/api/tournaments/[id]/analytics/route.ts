import { NextRequest, NextResponse } from 'next/server';
import { TournamentsController } from '@/adapters/controllers/tournaments-controller';
import {
  ApplicationNotFoundError,
  ApplicationValidationError,
} from '@/application/errors';

const controller = new TournamentsController();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const analytics = await controller.getAnalytics({ tournamentId: id });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching tournament analytics:', error);

    if (error instanceof ApplicationValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch tournament analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
