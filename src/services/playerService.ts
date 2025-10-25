import { prisma } from '@/lib/db';
import { PlayerSchema, PlayerUpdateSchema } from '@/lib/validations';
import { z } from 'zod';

export class PlayerService {
  async getPlayers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    clubId?: string
  ) {
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
      ...(clubId && { clubId }),
    };

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              subscriptionTier: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
            },
          },
          roleStats: true,
        },
        orderBy: {
          eloRating: 'desc',
        },
      }),
      prisma.player.count({ where }),
    ]);

    return {
      data: players,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPlayerById(id: string) {
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionTier: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
          },
        },
        roleStats: true,
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
          take: 10,
        },
      },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    return player;
  }

  async createPlayer(data: z.infer<typeof PlayerSchema>, userId: string) {
    const validatedData = PlayerSchema.parse(data);

    const player = await prisma.player.create({
      data: {
        ...validatedData,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        club: true,
      },
    });

    return player;
  }

  async updatePlayer(id: string, data: Partial<z.infer<typeof PlayerSchema>>) {
    const validatedData = PlayerUpdateSchema.parse(data);

    const player = await prisma.player.update({
      where: { id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        club: true,
        roleStats: true,
      },
    });

    return player;
  }

  async deletePlayer(id: string) {
    await prisma.player.delete({
      where: { id },
    });
  }

  async getPlayerAnalytics(
    playerId: string,
    _role?: string,
    _period: string = 'all_time'
  ) {
    const player = await this.getPlayerById(playerId);

    if (!player) {
      throw new Error('Player not found');
    }

    // Calculate analytics based on role and period
    const analytics = {
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
      recentGames: player.participations.map((p) => ({
        gameId: p.game.id,
        date: p.game.date,
        role: p.role,
        team: p.team,
        isWinner: p.isWinner,
        performanceScore: p.performanceScore,
        gameStatus: p.game.status,
        winnerTeam: p.game.winnerTeam,
      })),
    };

    return analytics;
  }
}
