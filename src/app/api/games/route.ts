import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { autoTriggerImportIfNeeded } from '@/lib/gomafia/import/auto-trigger';

// Query parameters validation schema
const GamesQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default(1),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .default(10),
  search: z.string().optional(),
  status: z
    .enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).optional(),
  tournamentId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['date', 'winnerTeam', 'status']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    // Auto-trigger import if database is empty
    await autoTriggerImportIfNeeded();

    const { searchParams } = new URL(request.url);
    const query = GamesQuerySchema.parse(Object.fromEntries(searchParams));

    // Build base where clause (non-search filters)
    const baseWhere: Record<string, unknown> = {};

    if (query.status) {
      baseWhere.status = query.status;
    }

    if (query.winnerTeam) {
      baseWhere.winnerTeam = query.winnerTeam;
    }

    if (query.tournamentId) {
      baseWhere.tournamentId = query.tournamentId;
    }

    if (query.startDate || query.endDate) {
      baseWhere.date = {} as { gte?: Date; lte?: Date };
      if (query.startDate) {
        (baseWhere.date as { gte: Date }).gte = new Date(query.startDate);
      }
      if (query.endDate) {
        (baseWhere.date as { lte: Date }).lte = new Date(query.endDate);
      }
    }

    // Build orderBy clause
    const orderBy: Record<string, string> = {};
    orderBy[query.sortBy] = query.sortOrder;

    const hasSearch = !!query.search;
    const searchTerm = query.search?.toLowerCase() || '';
    let games: any[] = [];
    let total = 0;

    if (hasSearch && searchTerm) {
      // For search queries, fetch exact matches and partial matches separately
      // to ensure exact matches are always included

      // Build where clause for exact matches (player name equals search)
      const exactWhere: Record<string, unknown> = {
        ...baseWhere,
        participations: {
          some: {
            player: {
              name: {
                equals: query.search,
                mode: 'insensitive',
              },
            },
          },
        },
      };

      // Build where clause for all matches (player name contains search)
      const allMatchesWhere: Record<string, unknown> = {
        ...baseWhere,
        participations: {
          some: {
            player: {
              name: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
          },
        },
      };

      // Fetch exact matches (no limit, sorted by user's preference)
      // Fetch all matches (larger set to ensure good pagination, up to 1000)
      const fetchLimit = Math.min(1000, query.limit * 10);

      const [exactMatches, allMatches, _exactCount, allCount] =
        await Promise.all([
          db.game.findMany({
            where: exactWhere,
            orderBy,
            select: {
              id: true,
              gomafiaId: true,
              date: true,
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
          db.game.findMany({
            where: allMatchesWhere,
            orderBy,
            take: fetchLimit,
            select: {
              id: true,
              gomafiaId: true,
              date: true,
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
          db.game.count({ where: exactWhere }),
          db.game.count({ where: allMatchesWhere }),
        ]);

      // Filter out exact matches from allMatches to get only partial matches
      const exactMatchIds = new Set(exactMatches.map((g) => g.id));
      const partialMatches = allMatches.filter((g) => !exactMatchIds.has(g.id));

      // Combine: exact matches first, then partial matches
      const allGames = [...exactMatches, ...partialMatches];
      total = allCount;

      // Apply pagination
      const paginatedSkip = (query.page - 1) * query.limit;
      games = allGames.slice(paginatedSkip, paginatedSkip + query.limit);
    } else {
      // For non-search queries, use normal pagination
      const skip = (query.page - 1) * query.limit;
      const where: Record<string, unknown> = { ...baseWhere };

      const [allGames, totalCount] = await Promise.all([
        db.game.findMany({
          where,
          orderBy,
          skip,
          take: query.limit,
          select: {
            id: true,
            gomafiaId: true,
            date: true,
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
      games = allGames;
      total = totalCount;
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / query.limit);
    const hasNext = query.page < totalPages;
    const hasPrev = query.page > 1;

    const response = NextResponse.json({
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

    // Add cache headers for better performance (30 seconds)
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=60'
    );

    return response;
  } catch (error) {
    console.error('Error fetching games:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}
