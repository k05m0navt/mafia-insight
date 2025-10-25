import { prisma } from '@/lib/db';
import { TournamentSchema } from '@/lib/validations';
import { z } from 'zod';
import { TournamentStatus } from '@prisma/client';

export class TournamentService {
  async getTournaments(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string
  ) {
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
      ...(status && { status: status as TournamentStatus }),
    };

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          games: {
            include: {
              participations: {
                include: {
                  player: {
                    select: {
                      id: true,
                      name: true,
                      eloRating: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              games: true,
            },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
      }),
      prisma.tournament.count({ where }),
    ]);

    return {
      data: tournaments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTournamentById(id: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        games: {
          include: {
            participations: {
              include: {
                player: {
                  select: {
                    id: true,
                    name: true,
                    eloRating: true,
                  },
                },
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        },
        _count: {
          select: {
            games: true,
          },
        },
      },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    return tournament;
  }

  async createTournament(
    data: z.infer<typeof TournamentSchema>,
    userId: string
  ) {
    const validatedData = TournamentSchema.parse(data);

    const tournament = await prisma.tournament.create({
      data: {
        ...validatedData,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return tournament;
  }

  async updateTournament(
    id: string,
    data: Partial<z.infer<typeof TournamentSchema>>
  ) {
    const validatedData = TournamentSchema.partial().parse(data);

    const tournament = await prisma.tournament.update({
      where: { id },
      data: validatedData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        games: {
          include: {
            participations: {
              include: {
                player: {
                  select: {
                    id: true,
                    name: true,
                    eloRating: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return tournament;
  }

  async deleteTournament(id: string) {
    await prisma.tournament.delete({
      where: { id },
    });
  }

  async getTournamentAnalytics(tournamentId: string) {
    const tournament = await this.getTournamentById(tournamentId);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const gamesPlayed = tournament.games.filter(
      (game) => game.status === 'COMPLETED'
    ).length;
    const totalDuration = tournament.games.reduce(
      (sum, game) => sum + (game.durationMinutes || 0),
      0
    );
    const averageDuration = gamesPlayed > 0 ? totalDuration / gamesPlayed : 0;

    const winnerDistribution = {
      blackWins: tournament.games.filter((game) => game.winnerTeam === 'BLACK')
        .length,
      redWins: tournament.games.filter((game) => game.winnerTeam === 'RED')
        .length,
      draws: tournament.games.filter((game) => game.winnerTeam === 'DRAW')
        .length,
    };

    // Calculate participant statistics
    const participants = new Map();
    tournament.games.forEach((game) => {
      game.participations.forEach((participation) => {
        const playerId = participation.player.id;
        if (!participants.has(playerId)) {
          participants.set(playerId, {
            id: participation.player.id,
            name: participation.player.name,
            eloRating: participation.player.eloRating,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            roles: new Set(),
          });
        }

        const player = participants.get(playerId);
        player.gamesPlayed++;
        if (participation.isWinner) {
          player.wins++;
        } else {
          player.losses++;
        }
        player.roles.add(participation.role);
      });
    });

    const participantStats = Array.from(participants.values()).map(
      (player) => ({
        ...player,
        winRate:
          player.gamesPlayed > 0 ? (player.wins / player.gamesPlayed) * 100 : 0,
        roles: Array.from(player.roles),
      })
    );

    // Sort by performance
    const topPerformers = participantStats
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 10);

    return {
      tournament,
      gamesPlayed,
      averageDuration,
      winnerDistribution,
      participantStats,
      topPerformers,
    };
  }

  async getLiveUpdates(tournamentId: string) {
    const tournament = await this.getTournamentById(tournamentId);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Get recent games and their status
    const recentGames = tournament.games
      .filter(
        (game) => game.status === 'IN_PROGRESS' || game.status === 'COMPLETED'
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      tournament,
      recentGames,
      lastUpdated: new Date().toISOString(),
    };
  }
}
