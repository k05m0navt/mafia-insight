import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { autoTriggerImportIfNeeded } from '@/lib/gomafia/import/auto-trigger';

// Query parameters validation schema
const PlayersQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .default('10'),
  search: z.string().optional(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
  clubId: z.string().uuid().optional(),
  sortBy: z
    .enum(['name', 'eloRating', 'totalGames', 'wins', 'losses', 'lastSyncAt'])
    .default('lastSyncAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    // Auto-trigger import if database is empty
    await autoTriggerImportIfNeeded();

    const { searchParams } = new URL(request.url);
    const query = PlayersQuerySchema.parse(Object.fromEntries(searchParams));

    // Build where clause
    const where: Record<string, unknown> = {};

    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    if (query.syncStatus) {
      where.syncStatus = query.syncStatus;
    }

    if (query.clubId) {
      where.clubId = query.clubId;
    }

    // Build orderBy clause
    const orderBy: Record<string, string> = {};
    orderBy[query.sortBy] = query.sortOrder;

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Execute queries in parallel
    const [players, total] = await Promise.all([
      db.player.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        select: {
          id: true,
          gomafiaId: true,
          name: true,
          eloRating: true,
          totalGames: true,
          wins: true,
          losses: true,
          lastSyncAt: true,
          syncStatus: true,
          clubId: true,
        },
      }),
      db.player.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / query.limit);
    const hasNext = query.page < totalPages;
    const hasPrev = query.page > 1;

    return NextResponse.json({
      players,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    console.error('Error fetching players:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
