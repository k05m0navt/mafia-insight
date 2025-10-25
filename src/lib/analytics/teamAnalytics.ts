import { prisma } from '@/lib/db';

export class TeamAnalytics {
  async calculateClubPerformance(clubId: string, period: string = 'all_time') {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        players: {
          include: {
            roleStats: true,
            participations: {
              include: {
                game: {
                  select: {
                    date: true,
                    status: true,
                    winnerTeam: true,
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

    // Calculate overall team performance
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

    // Calculate role distribution
    const roleDistribution = club.players.reduce(
      (acc, player) => {
        player.roleStats.forEach((roleStat) => {
          if (!acc[roleStat.role]) {
            acc[roleStat.role] = 0;
          }
          acc[roleStat.role] += roleStat.gamesPlayed;
        });
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate trends over time
    const trends = await this.calculateTrends(clubId, period);

    // Calculate member performance rankings
    const memberRankings = club.players
      .map((player) => ({
        id: player.id,
        name: player.name,
        eloRating: player.eloRating,
        totalGames: player.totalGames,
        wins: player.wins,
        losses: player.losses,
        winRate:
          player.totalGames > 0 ? (player.wins / player.totalGames) * 100 : 0,
        roleStats: player.roleStats,
      }))
      .sort((a, b) => b.eloRating - a.eloRating);

    return {
      club,
      totalGames,
      totalWins,
      winRate: totalGames > 0 ? (totalWins / totalGames) * 100 : 0,
      averageElo,
      roleDistribution,
      trends,
      memberRankings,
    };
  }

  async calculateTrends(_clubId: string, _period: string) {
    // This would calculate performance trends over time
    // For now, return empty array as placeholder
    return [];
  }

  async getClubLeaderboard(limit: number = 50) {
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
        memberCount: club.players.length,
      };
    });

    return clubStats
      .sort((a, b) => b.averageElo - a.averageElo)
      .map((club, index) => ({
        rank: index + 1,
        ...club,
      }));
  }

  async getClubComparison(clubIds: string[]) {
    const clubs = await Promise.all(
      clubIds.map((id) => this.calculateClubPerformance(id))
    );

    return clubs.map((club) => ({
      id: club.club.id,
      name: club.club.name,
      memberCount: club.club.players.length,
      totalGames: club.totalGames,
      winRate: club.winRate,
      averageElo: club.averageElo,
    }));
  }
}
