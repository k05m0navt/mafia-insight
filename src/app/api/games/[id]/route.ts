import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Path parameters validation schema
const GameParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = GameParamsSchema.parse(await params);

    // Use select instead of include for better performance
    const game = await db.game.findUnique({
      where: { id },
      select: {
        id: true,
        gomafiaId: true,
        date: true,
        durationMinutes: true,
        winnerTeam: true,
        status: true,
        lastSyncAt: true,
        syncStatus: true,
        tournamentId: true,
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        participations: {
          select: {
            id: true,
            role: true,
            team: true,
            isWinner: true,
            player: {
              select: {
                id: true,
                gomafiaId: true,
                name: true,
                eloRating: true,
                totalGames: true,
                wins: true,
                losses: true,
              },
            },
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Calculate game statistics
    const participantCount = game.participations.length;
    const blackTeam = game.participations.filter((p) => p.team === 'BLACK');
    const redTeam = game.participations.filter((p) => p.team === 'RED');
    const winners = game.participations.filter((p) => p.isWinner);
    const losers = game.participations.filter((p) => !p.isWinner);

    // Calculate team statistics
    const blackTeamStats = {
      count: blackTeam.length,
      averageElo:
        blackTeam.length > 0
          ? Math.round(
              blackTeam.reduce((sum, p) => sum + p.player.eloRating, 0) /
                blackTeam.length
            )
          : 0,
      roles: blackTeam.reduce(
        (acc, p) => {
          acc[p.role] = (acc[p.role] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    const redTeamStats = {
      count: redTeam.length,
      averageElo:
        redTeam.length > 0
          ? Math.round(
              redTeam.reduce((sum, p) => sum + p.player.eloRating, 0) /
                redTeam.length
            )
          : 0,
      roles: redTeam.reduce(
        (acc, p) => {
          acc[p.role] = (acc[p.role] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    // Calculate duration in hours
    const durationHours = game.durationMinutes ? game.durationMinutes / 60 : 0;

    return NextResponse.json({
      ...game,
      statistics: {
        participantCount,
        blackTeam: blackTeamStats,
        redTeam: redTeamStats,
        winners: winners.map((p) => ({
          id: p.player.id,
          name: p.player.name,
          role: p.role,
          team: p.team,
        })),
        losers: losers.map((p) => ({
          id: p.player.id,
          name: p.player.name,
          role: p.role,
          team: p.team,
        })),
        durationHours: Math.round(durationHours * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching game:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid game ID', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}
