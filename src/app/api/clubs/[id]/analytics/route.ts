import { NextRequest, NextResponse } from 'next/server';
import { ClubsController } from '@/adapters/controllers/clubs-controller';
import {
  ApplicationNotFoundError,
  ApplicationValidationError,
} from '@/application/errors';

const controller = new ClubsController();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const _period = searchParams.get('period');
    const { id } = await params;

    const analytics = await controller.getAnalytics({ clubId: id });
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching club analytics:', error);

    if (error instanceof ApplicationValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch club analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
