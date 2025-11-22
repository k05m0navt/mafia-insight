import { NextRequest, NextResponse } from 'next/server';
import { PlayersController } from '@/adapters/controllers/players-controller';
import {
  ApplicationNotFoundError,
  ApplicationValidationError,
} from '@/application/errors';
import { PlayerPresenter } from '@/adapters/presenters';

const controller = new PlayersController();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const _role = searchParams.get('role');
    const _period = searchParams.get('period');

    const { id } = await params;
    const analytics = await controller.getPlayerAnalytics(id);
    return NextResponse.json(PlayerPresenter.toAnalyticsResponse(analytics));
  } catch (error) {
    console.error('Error fetching player analytics:', error);

    if (error instanceof ApplicationValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch player analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
