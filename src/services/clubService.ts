import { prisma } from '@/lib/db';
import { ClubSchema } from '@/lib/validations';
import { z } from 'zod';

export class ClubService {
  async getClubs(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
    };

    const [clubs, total] = await Promise.all([
      prisma.club.findMany({
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
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              players: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.club.count({ where }),
    ]);

    return {
      data: clubs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getClubById(id: string) {
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            roleStats: true,
          },
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!club) {
      throw new Error('Club not found');
    }

    return club;
  }

  async createClub(data: z.infer<typeof ClubSchema>, userId: string) {
    const validatedData = ClubSchema.parse(data);

    const club = await prisma.club.create({
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

    return club;
  }

  async updateClub(id: string, data: Partial<z.infer<typeof ClubSchema>>) {
    const validatedData = ClubSchema.partial().parse(data);

    const club = await prisma.club.update({
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
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return club;
  }

  async deleteClub(id: string) {
    await prisma.club.delete({
      where: { id },
    });
  }

  async addPlayerToClub(clubId: string, playerId: string) {
    const player = await prisma.player.update({
      where: { id: playerId },
      data: { clubId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return player;
  }

  async removePlayerFromClub(_clubId: string, playerId: string) {
    const player = await prisma.player.update({
      where: { id: playerId },
      data: { clubId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return player;
  }

  async getClubAnalytics(clubId: string, _period: string = 'all_time') {
    const club = await this.getClubById(clubId);

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

    // Calculate top performers
    const topPerformers = club.players
      .sort((a, b) => b.eloRating - a.eloRating)
      .slice(0, 5)
      .map((player) => ({
        id: player.id,
        name: player.name,
        eloRating: player.eloRating,
        totalGames: player.totalGames,
        wins: player.wins,
        winRate:
          player.totalGames > 0 ? (player.wins / player.totalGames) * 100 : 0,
      }));

    return {
      club,
      memberCount,
      totalGames,
      totalWins,
      winRate: totalGames > 0 ? (totalWins / totalGames) * 100 : 0,
      averageElo,
      roleDistribution,
      topPerformers,
    };
  }
}
