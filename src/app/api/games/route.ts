import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Query parameters validation schema
const GamesQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default(1),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .default(10),
  status: z
    .enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).optional(),
  tournamentId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z
    .enum(['date', 'durationMinutes', 'winnerTeam', 'status'])
    .default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = GamesQuerySchema.parse(Object.fromEntries(searchParams));

    // Build where clause
    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.winnerTeam) {
      where.winnerTeam = query.winnerTeam;
    }

    if (query.tournamentId) {
      where.tournamentId = query.tournamentId;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    // Build orderBy clause
    const orderBy: Record<string, string> = {};
    orderBy[query.sortBy] = query.sortOrder;

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Execute queries in parallel
    const [games, total] = await Promise.all([
      db.game.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        select: {
          id: true,
          gomafiaId: true,
          date: true,
          durationMinutes: true,
          winnerTeam: true,
          status: true,
          lastSyncAt: true,
          syncStatus: true,
          tournamentId: true,
          participations: {
            select: {
              player: {
                select: {
                  id: true,
                  name: true,
                  eloRating: true,
                },
              },
              role: true,
              team: true,
              isWinner: true,
            },
          },
        },
      }),
      db.game.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / query.limit);
    const hasNext = query.page < totalPages;
    const hasPrev = query.page > 1;

    return NextResponse.json({
      games,
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
    console.error('Error fetching games:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}
