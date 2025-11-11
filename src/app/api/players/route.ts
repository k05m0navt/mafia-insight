import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { autoTriggerImportIfNeeded } from '@/lib/gomafia/import/auto-trigger';
import { PlayersController } from '@/adapters/controllers/players-controller';
import { ApplicationValidationError } from '@/application/errors';
import { PlayerPresenter } from '@/adapters/presenters';

const PlayersQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default(1),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .default(10),
  search: z.string().optional(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
  clubId: z.string().uuid().optional(),
  sortBy: z
    .enum(['name', 'eloRating', 'totalGames', 'wins', 'losses', 'lastSyncAt'])
    .default('lastSyncAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const controller = new PlayersController();

export async function GET(request: NextRequest) {
  try {
    await autoTriggerImportIfNeeded();

    const { searchParams } = new URL(request.url);
    const query = PlayersQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await controller.listPlayers({
      page: query.page,
      limit: query.limit,
      search: query.search ?? undefined,
      clubId: query.clubId ?? undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      syncStatus: query.syncStatus ?? undefined,
    });

    const response = NextResponse.json(PlayerPresenter.toListResponse(result));

    response.headers.set(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=60'
    );

    return response;
  } catch (error) {
    console.error('Error fetching players:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof ApplicationValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch players',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
