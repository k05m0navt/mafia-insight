import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const querySchema = z.object({
  year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate parameters
    const resolvedParams = await params;
    const { id: playerId } = paramsSchema.parse(resolvedParams);
    const { searchParams } = new URL(request.url);
    const { year } = querySchema.parse(Object.fromEntries(searchParams));

    // Get player basic info
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        name: true,
        eloRating: true,
        totalGames: true,
        wins: true,
        losses: true,
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Build where clause for year filtering
    const yearFilter = year
      ? {
          game: {
            date: {
              gte: new Date(`${year}-01-01`),
              lt: new Date(`${year + 1}-01-01`),
            },
          },
        }
      : {};

    // Get tournament history
    const tournamentHistory = await prisma.playerTournament.findMany({
      where: {
        playerId,
        ...(year
          ? {
              tournament: {
                startDate: {
                  gte: new Date(`${year}-01-01`),
                  lt: new Date(`${year + 1}-01-01`),
                },
              },
            }
          : {}),
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
            prizePool: true,
          },
        },
      },
      orderBy: {
        tournament: {
          startDate: 'desc',
        },
      },
    });

    // Get year statistics
    const yearStats = await prisma.playerYearStats.findMany({
      where: {
        playerId,
        ...(year ? { year } : {}),
      },
      orderBy: {
        year: 'desc',
      },
    });

    // Get recent game details
    const gameDetails = await prisma.gameParticipation.findMany({
      where: {
        playerId,
        ...yearFilter,
      },
      include: {
        game: {
          select: {
            id: true,
            date: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: {
        game: {
          date: 'desc',
        },
      },
      take: 20,
    });

    // Transform tournament history
    const transformedTournamentHistory = tournamentHistory.map((pt) => ({
      tournamentId: pt.tournament.id,
      tournamentName: pt.tournament.name,
      placement: pt.placement,
      ggPoints: pt.ggPoints,
      eloChange: pt.eloChange,
      prizeMoney: pt.tournament.prizePool ? Number(pt.tournament.prizePool) : 0,
      date: pt.tournament.startDate.toISOString(),
    }));

    // Transform year stats
    const transformedYearStats = yearStats.map((ys) => ({
      year: ys.year,
      totalGames: ys.totalGames,
      donGames: ys.donGames,
      mafiaGames: ys.mafiaGames,
      sheriffGames: ys.sheriffGames,
      civilianGames: ys.civilianGames,
      eloRating: ys.eloRating,
      extraPoints: ys.extraPoints,
    }));

    // Transform game details
    const transformedGameDetails = gameDetails.map((pg) => ({
      gameId: pg.game.id,
      date: pg.game.date.toISOString(),
      durationMinutes: pg.game.durationMinutes,
      role: pg.role,
      team: pg.team,
      isWinner: pg.isWinner,
      performanceScore: pg.performanceScore,
    }));

    const response = {
      player: {
        id: player.id,
        name: player.name,
        eloRating: player.eloRating,
        totalGames: player.totalGames,
        wins: player.wins,
        losses: player.losses,
      },
      tournamentHistory: transformedTournamentHistory,
      yearStats: transformedYearStats,
      gameDetails: transformedGameDetails,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching player statistics:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch player statistics' },
      { status: 500 }
    );
  }
}
