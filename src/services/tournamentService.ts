import { prisma } from '@/lib/db';
import { TournamentSchema } from '@/lib/validations';
import { z } from 'zod';
import { TournamentStatus } from '@prisma/client';

export class TournamentService {
  async getTournaments(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string,
    sortBy: string = 'startDate',
    sortOrder: 'asc' | 'desc' = 'desc',
    minPrizePool?: number
  ) {
    // Build orderBy clause
    let orderBy: any = {};
    if (sortBy === 'prizePool') {
      // For prize pool, we need to handle null values
      orderBy = { prizePool: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const hasSearch = !!search;
    const searchTerm = search?.toLowerCase() || '';
    let tournaments: any[] = [];
    let total = 0;

    // Base where clause for filters other than search
    const baseWhere: any = {
      ...(status && { status: status as TournamentStatus }),
      ...(minPrizePool !== undefined &&
        minPrizePool > 0 && {
          prizePool: {
            gte: minPrizePool,
          },
        }),
    };

    if (hasSearch && searchTerm) {
      // For search queries, fetch exact matches and partial matches separately
      // to ensure exact matches are always included, even when sorting by other fields

      // Build where clause for exact matches
      const exactWhere: any = {
        ...baseWhere,
        name: {
          equals: search,
          mode: 'insensitive' as const,
        },
      };

      // Build where clause for all matches (contains)
      const allMatchesWhere: any = {
        ...baseWhere,
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      };

      // Fetch exact matches (no limit, sorted by user's preference)
      // Fetch all matches (larger set to ensure good pagination, up to 1000)
      const fetchLimit = Math.min(1000, limit * 10);

      const [exactMatches, allMatches, _exactCount, allCount] =
        await Promise.all([
          prisma.tournament.findMany({
            where: exactWhere,
            orderBy,
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
          }),
          prisma.tournament.findMany({
            where: allMatchesWhere,
            orderBy,
            take: fetchLimit,
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
          }),
          prisma.tournament.count({ where: exactWhere }),
          prisma.tournament.count({ where: allMatchesWhere }),
        ]);

      // Filter out exact matches from allMatches to get only partial matches
      const exactMatchIds = new Set(exactMatches.map((t) => t.id));
      const partialMatches = allMatches.filter((t) => !exactMatchIds.has(t.id));

      // Combine: exact matches first, then partial matches
      const allTournaments = [...exactMatches, ...partialMatches];
      total = allCount;

      // Apply pagination
      const paginatedSkip = (page - 1) * limit;
      tournaments = allTournaments.slice(paginatedSkip, paginatedSkip + limit);
    } else {
      // For non-search queries, use normal pagination
      const skip = (page - 1) * limit;
      const where: any = { ...baseWhere };

      const [allTournaments, totalCount] = await Promise.all([
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
          orderBy,
        }),
        prisma.tournament.count({ where }),
      ]);
      tournaments = allTournaments;
      total = totalCount;
    }

    return {
      data: tournaments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
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

    const tournamentData = {
      id: validatedData.id,
      gomafiaId: validatedData.gomafiaId || validatedData.id,
      name: validatedData.name,
      startDate: validatedData.date,
      prizePool: validatedData.prizeMoney,
      maxParticipants: validatedData.maxPlayers,
      status: validatedData.status,
    };

    const tournament = await prisma.tournament.create({
      data: {
        ...tournamentData,
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
