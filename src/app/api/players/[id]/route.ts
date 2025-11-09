import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Path parameters validation schema
const PlayerParamsSchema = z.object({
  id: z.string().uuid(),
});

// Query parameters validation schema
const QuerySchema = z.object({
  year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = PlayerParamsSchema.parse(await params);
    const { searchParams } = new URL(request.url);
    const { year } = QuerySchema.parse(Object.fromEntries(searchParams));

    const player = await db.player.findUnique({
      where: { id },
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
        judgeCategory: true,
        judgeCanBeGs: true,
        judgeCanJudgeFinal: true,
        judgeMaxTablesAsGs: true,
        judgeRating: true,
        judgeGamesJudged: true,
        judgeAccreditationDate: true,
        judgeResponsibleFromSc: true,
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        participations: {
          select: {
            game: {
              select: {
                id: true,
                gomafiaId: true,
                date: true,
                durationMinutes: true,
                winnerTeam: true,
                status: true,
              },
            },
          },
          where: year
            ? {
                game: {
                  date: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`),
                  },
                },
              }
            : undefined,
          orderBy: {
            game: {
              date: 'desc',
            },
          },
          take: 10, // Limit to recent games
        },
        roleStats: {
          select: {
            role: true,
            gamesPlayed: true,
            wins: true,
            losses: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // If year filter is applied, get year-specific statistics
    let yearStats = null;
    if (year) {
      yearStats = await db.playerYearStats.findUnique({
        where: {
          playerId_year: {
            playerId: id,
            year: year,
          },
        },
      });
    }

    // Calculate additional statistics
    // If year filter is applied, use year-specific stats, otherwise use overall stats
    const totalGames = yearStats
      ? yearStats.totalGames
      : player.participations.length;
    const recentGames = player.participations.slice(0, 5);

    // Calculate wins and losses for the year if filtered
    let wins = player.wins;
    let losses = player.losses;
    if (year) {
      // Get year-specific participations with isWinner field
      const yearParticipations = await db.gameParticipation.findMany({
        where: {
          playerId: id,
          game: {
            date: {
              gte: new Date(`${year}-01-01`),
              lt: new Date(`${year + 1}-01-01`),
            },
          },
        },
        select: {
          isWinner: true,
        },
      });
      wins = yearParticipations.filter((p) => p.isWinner).length;
      losses = yearParticipations.length - wins;
    }

    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    // Get role statistics - filter by year if applicable
    const roleStatsQuery = year
      ? await db.gameParticipation.findMany({
          where: {
            playerId: id,
            game: {
              date: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${year + 1}-01-01`),
              },
            },
          },
          select: {
            role: true,
            isWinner: true,
          },
        })
      : null;

    const roleStats = roleStatsQuery
      ? roleStatsQuery.reduce(
          (acc, participation) => {
            const role = participation.role;
            if (!acc[role]) {
              acc[role] = {
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
              };
            }
            acc[role].gamesPlayed += 1;
            if (participation.isWinner) {
              acc[role].wins += 1;
            } else {
              acc[role].losses += 1;
            }
            acc[role].winRate =
              acc[role].gamesPlayed > 0
                ? (acc[role].wins / acc[role].gamesPlayed) * 100
                : 0;
            return acc;
          },
          {} as Record<
            string,
            {
              gamesPlayed: number;
              wins: number;
              losses: number;
              winRate: number;
            }
          >
        )
      : player.roleStats.reduce(
          (acc, stat) => {
            acc[stat.role] = {
              gamesPlayed: stat.gamesPlayed,
              wins: stat.wins,
              losses: stat.losses,
              winRate:
                stat.gamesPlayed > 0 ? (stat.wins / stat.gamesPlayed) * 100 : 0,
            };
            return acc;
          },
          {} as Record<
            string,
            {
              gamesPlayed: number;
              wins: number;
              losses: number;
              winRate: number;
            }
          >
        );

    // Get available years for this player
    const yearStatsList = await db.playerYearStats.findMany({
      where: { playerId: id },
      select: { year: true },
      orderBy: { year: 'desc' },
    });
    // Extract unique years
    const availableYears = Array.from(
      new Set(yearStatsList.map((ys) => ys.year))
    ).sort((a, b) => b - a);

    return NextResponse.json({
      ...player,
      wins: wins,
      losses: losses,
      totalGames: totalGames,
      statistics: {
        totalGames,
        winRate: Math.round(winRate * 100) / 100,
        recentGames,
        roleStats,
      },
      availableYears: availableYears,
    });
  } catch (error) {
    console.error('Error fetching player:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid player ID', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}
