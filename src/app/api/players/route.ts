import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { autoTriggerImportIfNeeded } from '@/lib/gomafia/import/auto-trigger';

// Query parameters validation schema
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

export async function GET(request: NextRequest) {
  try {
    // Auto-trigger import if database is empty (cached check)
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

    // If there's a search query, we need to prioritize exact matches
    const searchTerm = query.search?.toLowerCase() || '';
    const hasSearch = !!query.search;

    let players: Array<{
      id: string;
      gomafiaId: string;
      name: string;
      eloRating: number;
      totalGames: number;
      wins: number;
      losses: number;
      lastSyncAt: Date | null;
      syncStatus: 'SYNCED' | 'PENDING' | 'ERROR' | null;
      clubId: string | null;
    }> = [];
    let total = 0;

    if (hasSearch && searchTerm) {
      // For search queries, fetch exact matches and partial matches separately
      // to ensure exact matches are always included, even when sorting by other fields

      // Build where clause for exact matches
      const exactWhere = { ...where };
      exactWhere.name = {
        equals: query.search,
        mode: 'insensitive',
      };

      // Build where clause for all matches (contains)
      const allMatchesWhere = { ...where };

      // Fetch exact matches (no limit, sorted by user's preference)
      // Fetch all matches (larger set to ensure good pagination, up to 1000)
      // We'll filter out exact matches from partial matches in memory
      const fetchLimit = Math.min(1000, query.limit * 10);

      const [exactMatches, allMatches, _exactCount, allCount] =
        await Promise.all([
          db.player.findMany({
            where: exactWhere,
            orderBy,
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
          db.player.findMany({
            where: allMatchesWhere,
            orderBy,
            take: fetchLimit,
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
          db.player.count({ where: exactWhere }),
          db.player.count({ where: allMatchesWhere }),
        ]);

      // Filter out exact matches from allMatches to get only partial matches
      const exactMatchIds = new Set(exactMatches.map((p) => p.id));
      const partialMatches = allMatches.filter((p) => !exactMatchIds.has(p.id));

      // Combine: exact matches first, then partial matches
      // Both groups are already sorted by the user's sortBy/sortOrder
      const allPlayers = [...exactMatches, ...partialMatches];
      total = allCount; // Use total from all matches for accurate pagination

      // Apply pagination
      const paginatedSkip = (query.page - 1) * query.limit;
      players = allPlayers.slice(paginatedSkip, paginatedSkip + query.limit);
    } else {
      // For non-search queries, use normal pagination
      const skip = (query.page - 1) * query.limit;
      const [allPlayers, totalCount] = await Promise.all([
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
      players = allPlayers;
      total = totalCount;
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / query.limit);
    const hasNext = query.page < totalPages;
    const hasPrev = query.page > 1;

    const response = NextResponse.json({
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

    // Add cache headers for better performance (30 seconds)
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

    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
