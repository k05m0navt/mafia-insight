import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PlayersController } from '@/adapters/controllers/players-controller';
import {
  ApplicationNotFoundError,
  ApplicationValidationError,
} from '@/application/errors';
import { PlayerPresenter } from '@/adapters/presenters';

const PlayerParamsSchema = z.object({
  id: z.string().uuid(),
});

const QuerySchema = z.object({
  year: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }),
});

const controller = new PlayersController();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = PlayerParamsSchema.parse(await params);
    const { searchParams } = new URL(request.url);
    const { year } = QuerySchema.parse(Object.fromEntries(searchParams));

    const profile = await controller.getPlayerProfile(id, {
      year,
    });

    return NextResponse.json(PlayerPresenter.toProfileResponse(profile));
  } catch (error) {
    console.error('Error fetching player:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid player ID', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof ApplicationValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}
