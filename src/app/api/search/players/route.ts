import { NextRequest, NextResponse } from 'next/server';
import { searchQuerySchema } from '@/lib/validations';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/apiAuth';
import { formatErrorResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    await withAuth('GUEST')(request);

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

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        skip: (validatedQuery.page - 1) * validatedQuery.limit,
        take: validatedQuery.limit,
        orderBy: {
          name: 'asc',
        },
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
      }),
      prisma.player.count({ where }),
    ]);

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
