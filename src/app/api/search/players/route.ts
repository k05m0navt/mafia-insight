import { NextRequest, NextResponse } from 'next/server';
import { searchQuerySchema } from '@/lib/validations';
import { resilientDB } from '@/lib/db-resilient';
import { formatErrorResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const query = {
      q: searchParams.get('q') || undefined,
      region: searchParams.get('region') || undefined,
      year: searchParams.get('year')
        ? parseInt(searchParams.get('year')!)
        : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    // Get sortBy and sortOrder (not in base schema)
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const validatedQuery = searchQuerySchema.parse(query);

    // Build where clause for Prisma
    const where: {
      name?: {
        contains: string;
        mode: 'insensitive';
      };
      region?: string;
      eloRating?: {
        gte?: number;
        lte?: number;
      };
    } = {};

    // Text search
    if (validatedQuery.q) {
      where.name = {
        contains: validatedQuery.q,
        mode: 'insensitive',
      };
    }

    // Region filter
    if (validatedQuery.region) {
      where.region = validatedQuery.region;
    }

    // Year filter (if we have year-based data)
    if (validatedQuery.year) {
      // This would need to be implemented based on your data structure
      // For now, we'll skip year filtering
    }

    // Execute search
    const startTime = Date.now();

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    const validSortFields = [
      'name',
      'eloRating',
      'totalGames',
      'wins',
      'losses',
      'lastSyncAt',
    ];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy['name'] = 'asc'; // Default
    }

    // If there's a search query, we need to prioritize exact matches
    const searchTerm = validatedQuery.q?.toLowerCase() || '';
    const hasSearch = !!validatedQuery.q;

    let players: Array<{
      id: string;
      gomafiaId: string;
      name: string;
      eloRating: number;
      totalGames: number;
      wins: number;
      losses: number;
      region: string | null;
      clubId: string | null;
      lastSyncAt: Date | null;
      syncStatus: 'SYNCED' | 'PENDING' | 'ERROR' | null;
    }> = [];
    let total = 0;

    if (hasSearch && searchTerm && validatedQuery.q) {
      // For search queries, fetch exact matches and partial matches separately
      // to ensure exact matches are always included, even when sorting by other fields

      // Build where clause for exact matches
      const exactWhere = {
        ...where,
        name: {
          equals: validatedQuery.q,
          mode: 'insensitive' as const,
        },
      };

      // Build where clause for all matches (contains)
      const allMatchesWhere = { ...where };

      // Fetch exact matches (no limit, sorted by user's preference)
      // Fetch all matches (larger set to ensure good pagination, up to 1000)
      // We'll filter out exact matches from partial matches in memory
      const fetchLimit = Math.min(1000, validatedQuery.limit * 10);

      const [exactMatches, allMatches, _exactCount, allCount] =
        await Promise.all([
          resilientDB.execute((prisma) =>
            prisma.player.findMany({
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
                region: true,
                clubId: true,
                lastSyncAt: true,
                syncStatus: true,
              },
            })
          ),
          resilientDB.execute((prisma) =>
            prisma.player.findMany({
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
                region: true,
                clubId: true,
                lastSyncAt: true,
                syncStatus: true,
              },
            })
          ),
          resilientDB.execute((prisma) =>
            prisma.player.count({ where: exactWhere })
          ),
          resilientDB.execute((prisma) =>
            prisma.player.count({ where: allMatchesWhere })
          ),
        ]);

      // Filter out exact matches from allMatches to get only partial matches
      const exactMatchIds = new Set(exactMatches.map((p) => p.id));
      const partialMatches = allMatches.filter((p) => !exactMatchIds.has(p.id));

      // Combine: exact matches first, then partial matches
      // Both groups are already sorted by the user's sortBy/sortOrder
      const allPlayers = [...exactMatches, ...partialMatches];
      total = allCount; // Use total from all matches for accurate pagination

      // Apply pagination
      const paginatedSkip = (validatedQuery.page - 1) * validatedQuery.limit;
      players = allPlayers.slice(
        paginatedSkip,
        paginatedSkip + validatedQuery.limit
      );
    } else {
      // For non-search queries, use normal pagination
      const skip = (validatedQuery.page - 1) * validatedQuery.limit;
      const [allPlayers, totalCount] = await Promise.all([
        resilientDB.execute((prisma) =>
          prisma.player.findMany({
            where,
            orderBy,
            skip,
            take: validatedQuery.limit,
            select: {
              id: true,
              gomafiaId: true,
              name: true,
              eloRating: true,
              totalGames: true,
              wins: true,
              losses: true,
              region: true,
              clubId: true,
              lastSyncAt: true,
              syncStatus: true,
            },
          })
        ),
        resilientDB.execute((prisma) => prisma.player.count({ where })),
      ]);
      players = allPlayers;
      total = totalCount;
    }

    const searchTime = Date.now() - startTime;
    const totalPages = Math.ceil(total / validatedQuery.limit);

    // Format response
    const response = {
      players,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages,
        hasNext: validatedQuery.page < totalPages,
        hasPrev: validatedQuery.page > 1,
      },
      searchTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);

    if (error instanceof Error) {
      const errorResponse = formatErrorResponse(error);
      return NextResponse.json(errorResponse, {
        status: errorResponse.code === 'VALIDATION_ERROR' ? 400 : 500,
      });
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
