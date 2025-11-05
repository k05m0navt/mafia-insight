import { prisma } from '@/lib/db';
import { PlayerRole } from '@prisma/client';

export class AnalyticsService {
  async getPlayerAnalytics(
    playerId: string,
    role?: string,
    _period: string = 'all_time'
  ) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        roleStats: role ? { where: { role: role as PlayerRole } } : true,
        participations: {
          include: {
            game: {
              select: {
                id: true,
                date: true,
                status: true,
                winnerTeam: true,
              },
            },
          },
          orderBy: {
            game: {
              date: 'desc',
            },
          },
          take: 50,
        },
      },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Calculate trends data
    const trends = await this.calculatePlayerTrends();

    // Calculate rankings
    const rankings = await this.calculatePlayerRankings(playerId, role);

    return {
      player,
      overallStats: {
        totalGames: player.totalGames,
        wins: player.wins,
        losses: player.losses,
        winRate:
          player.totalGames > 0 ? (player.wins / player.totalGames) * 100 : 0,
        eloRating: player.eloRating,
      },
      roleStats: player.roleStats,
      trends,
      rankings,
    };
  }

  async getClubAnalytics(clubId: string, _period: string = 'all_time') {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        president: {
          select: {
            id: true,
            name: true,
            gomafiaId: true,
            eloRating: true,
          },
        },
        players: {
          include: {
            roleStats: true,
            participations: {
              include: {
                game: {
                  select: {
                    date: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!club) {
      throw new Error('Club not found');
    }

    const memberCount = club.players.length;
    const totalGames = club.players.reduce(
      (sum, player) => sum + player.totalGames,
      0
    );
    const totalWins = club.players.reduce(
      (sum, player) => sum + player.wins,
      0
    );
    const averageElo =
      club.players.length > 0
        ? club.players.reduce((sum, player) => sum + player.eloRating, 0) /
          club.players.length
        : 0;

    const trends = await this.calculateClubTrends();

    return {
      club,
      memberCount,
      totalGames,
      totalWins,
      winRate: totalGames > 0 ? (totalWins / totalGames) * 100 : 0,
      averageElo,
      trends,
    };
  }

  async getTournamentAnalytics(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
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

    return {
      tournament,
      gamesPlayed,
      averageDuration,
      winnerDistribution,
    };
  }

  async getLeaderboard(
    type: 'players' | 'clubs',
    role?: string,
    _period: string = 'all_time',
    limit: number = 50
  ) {
    if (type === 'players') {
      return this.getPlayerLeaderboard(role, limit);
    } else {
      return this.getClubLeaderboard(limit);
    }
  }

  private async getPlayerLeaderboard(role?: string, limit: number = 50) {
    const players = await prisma.player.findMany({
      include: {
        roleStats: role ? { where: { role: role as PlayerRole } } : true,
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        eloRating: 'desc',
      },
      take: limit,
    });

    return players.map((player, index) => ({
      rank: index + 1,
      entity: player,
      metricValue: player.eloRating,
      change: 0, // TODO: Calculate change from previous period
    }));
  }

  private async getClubLeaderboard(limit: number = 50) {
    const clubs = await prisma.club.findMany({
      include: {
        players: {
          include: {
            roleStats: true,
          },
        },
      },
      take: limit,
    });

    const clubStats = clubs.map((club) => {
      const totalGames = club.players.reduce(
        (sum, player) => sum + player.totalGames,
        0
      );
      const totalWins = club.players.reduce(
        (sum, player) => sum + player.wins,
        0
      );
      const averageElo =
        club.players.length > 0
          ? club.players.reduce((sum, player) => sum + player.eloRating, 0) /
            club.players.length
          : 0;

      return {
        club,
        totalGames,
        totalWins,
        averageElo,
        winRate: totalGames > 0 ? (totalWins / totalGames) * 100 : 0,
      };
    });

    return clubStats
      .sort((a, b) => b.averageElo - a.averageElo)
      .map((club, index) => ({
        rank: index + 1,
        entity: club.club,
        metricValue: club.averageElo,
        change: 0, // TODO: Calculate change from previous period
      }));
  }

  private async calculatePlayerTrends() {
    // TODO: Implement trend calculation based on period
    // This would involve querying historical data and calculating metrics over time
    return [];
  }

  private async calculateClubTrends() {
    // TODO: Implement club trend calculation
    return [];
  }

  private async calculatePlayerRankings(playerId: string, role?: string) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return { globalRank: 0, roleRank: {} };
    }

    // Calculate global rank
    const globalRank =
      (await prisma.player.count({
        where: {
          eloRating: { gt: player.eloRating },
        },
      })) + 1;

    // Calculate role-specific ranks
    const roleRanks: Record<string, number> = {};

    if (role) {
      const roleRank =
        (await prisma.playerRoleStats.count({
          where: {
            role: role as PlayerRole,
            winRate: { gt: 0 }, // TODO: Get player's win rate for this role
          },
        })) + 1;

      roleRanks[role] = roleRank;
    }

    return {
      globalRank,
      roleRank: roleRanks,
    };
  }
}
