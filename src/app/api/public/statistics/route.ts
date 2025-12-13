import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Public Statistics API Endpoint
 * Returns aggregated community-wide statistics (read-only, anonymized)
 * No authentication required - accessible to guests
 */

export interface PublicStatistics {
  totalPlayers: number;
  totalGames: number;
  totalTournaments: number;
  totalClubs: number;
  averageEloRating: number;
  totalWins: number;
  totalLosses: number;
  lastUpdated: string;
}

// Cache duration: 5 minutes (300 seconds)
const CACHE_DURATION = 300;

/**
 * GET /api/public/statistics
 * Returns aggregated public statistics
 */
export async function GET() {
  try {
    // Aggregate community-wide statistics
    const [
      totalPlayers,
      totalGames,
      totalTournaments,
      totalClubs,
      averageEloResult,
      winsResult,
      lossesResult,
    ] = await Promise.all([
      // Total players
      prisma.player.count(),

      // Total games (completed only)
      prisma.game.count({
        where: {
          status: 'COMPLETED',
        },
      }),

      // Total tournaments
      prisma.tournament.count(),

      // Total clubs
      prisma.club.count(),

      // Average ELO rating
      prisma.player.aggregate({
        _avg: {
          eloRating: true,
        },
      }),

      // Total wins
      prisma.gameParticipation.count({
        where: {
          isWinner: true,
        },
      }),

      // Total losses
      prisma.gameParticipation.count({
        where: {
          isWinner: false,
        },
      }),
    ]);

    const averageEloRating = Math.round(
      averageEloResult._avg.eloRating || 1200
    );

    const statistics: PublicStatistics = {
      totalPlayers,
      totalGames,
      totalTournaments,
      totalClubs,
      averageEloRating,
      totalWins: winsResult,
      totalLosses: lossesResult,
      lastUpdated: new Date().toISOString(),
    };

    // Return with cache headers
    return NextResponse.json(statistics, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching public statistics:', error);

    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message?: string };
      
      // Database connection errors
      if (prismaError.code === 'P1001' || prismaError.code === 'P1002') {
        return NextResponse.json(
          {
            error: 'Database connection failed',
            message: 'Unable to connect to the database. Please try again later.',
          },
          { status: 503 }
        );
      }

      // Query timeout errors
      if (prismaError.code === 'P1008') {
        return NextResponse.json(
          {
            error: 'Query timeout',
            message: 'The database query took too long. Please try again later.',
          },
          { status: 504 }
        );
      }

      // Other Prisma errors
      return NextResponse.json(
        {
          error: 'Database error',
          message: prismaError.message || 'A database error occurred.',
        },
        { status: 500 }
      );
    }

    // Generic error handling
    return NextResponse.json(
      {
        error: 'Failed to fetch public statistics',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}



