import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Path parameters validation schema
const PlayerParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = PlayerParamsSchema.parse(params);

    const player = await db.player.findUnique({
      where: { id },
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        participations: {
          include: {
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

    // Calculate additional statistics
    const totalGames = player.participations.length;
    const recentGames = player.participations.slice(0, 5);
    const winRate =
      player.totalGames > 0 ? (player.wins / player.totalGames) * 100 : 0;

    // Get role statistics
    const roleStats = player.roleStats.reduce(
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
        { gamesPlayed: number; wins: number; losses: number; winRate: number }
      >
    );

    return NextResponse.json({
      ...player,
      statistics: {
        totalGames,
        winRate: Math.round(winRate * 100) / 100,
        recentGames,
        roleStats,
      },
    });
  } catch (error) {
    console.error('Error fetching player:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid player ID', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}
