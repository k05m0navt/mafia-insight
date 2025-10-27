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

    // Build where clause
    const where: any = {};

    if (active !== undefined) {
      where.isActive = active;
    }

    if (country) {
      where.country = {
        contains: country,
        mode: 'insensitive',
      };
    }

    if (search) {
      where.OR = [
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
      ];
    }

    // Get regions with player counts
    const regions = await prisma.region.findMany({
      where,
      orderBy: [{ country: 'asc' }, { name: 'asc' }],
    });

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
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    );
  }
}
