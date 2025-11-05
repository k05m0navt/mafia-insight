import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  active: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  country: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { active, country, search } = querySchema.parse(
      Object.fromEntries(searchParams)
    );

    // Build base where clause (non-search filters)
    const baseWhere: {
      isActive?: boolean;
      country?: {
        contains: string;
        mode: 'insensitive';
      };
    } = {};

    if (active !== undefined) {
      baseWhere.isActive = active;
    }

    if (country) {
      baseWhere.country = {
        contains: country,
        mode: 'insensitive',
      };
    }

    const hasSearch = !!search;
    const searchTerm = search?.toLowerCase() || '';
    let regions: any[] = [];

    if (hasSearch && searchTerm) {
      // For search queries, fetch exact matches and partial matches separately
      // to ensure exact matches are always included

      // Build where clause for exact matches (name or country equals search)
      const exactWhere: {
        isActive?: boolean;
        country?: {
          contains: string;
          mode: 'insensitive';
        };
        OR: Array<{
          name?: {
            equals: string;
            mode: 'insensitive';
          };
          country?: {
            equals: string;
            mode: 'insensitive';
          };
        }>;
      } = {
        ...baseWhere,
        OR: [
          {
            name: {
              equals: search,
              mode: 'insensitive',
            },
          },
          {
            country: {
              equals: search,
              mode: 'insensitive',
            },
          },
        ],
      };

      // Build where clause for all matches (name or country contains search)
      const allMatchesWhere: {
        isActive?: boolean;
        country?: {
          contains: string;
          mode: 'insensitive';
        };
        OR: Array<{
          name?: {
            contains: string;
            mode: 'insensitive';
          };
          country?: {
            contains: string;
            mode: 'insensitive';
          };
        }>;
      } = {
        ...baseWhere,
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            country: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      };

      // Fetch exact matches and all matches
      const [exactMatches, allMatches] = await Promise.all([
        prisma.region.findMany({
          where: exactWhere,
          orderBy: [{ country: 'asc' }, { name: 'asc' }],
        }),
        prisma.region.findMany({
          where: allMatchesWhere,
          orderBy: [{ country: 'asc' }, { name: 'asc' }],
        }),
      ]);

      // Filter out exact matches from allMatches to get only partial matches
      const exactMatchCodes = new Set(exactMatches.map((r) => r.code));
      const partialMatches = allMatches.filter(
        (r) => !exactMatchCodes.has(r.code)
      );

      // Combine: exact matches first, then partial matches
      regions = [...exactMatches, ...partialMatches];
    } else {
      // For non-search queries, use normal query
      const where: {
        isActive?: boolean;
        country?: {
          contains: string;
          mode: 'insensitive';
        };
      } = { ...baseWhere };

      regions = await prisma.region.findMany({
        where,
        orderBy: [{ country: 'asc' }, { name: 'asc' }],
      });
    }

    // Transform the data
    const transformedRegions = regions.map((region) => ({
      code: region.code,
      name: region.name,
      country: region.country,
      isActive: region.isActive,
      playerCount: region.playerCount,
    }));

    // Get summary statistics
    const totalRegions = await prisma.region.count();
    const activeRegions = await prisma.region.count({
      where: { isActive: true },
    });
    const totalPlayers = await prisma.player.count();

    const response = {
      regions: transformedRegions,
      summary: {
        totalRegions,
        activeRegions,
        totalPlayers,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching regions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    );
  }
}
