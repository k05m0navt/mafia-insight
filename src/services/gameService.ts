import { prisma } from '@/lib/db';
import { GameSchema } from '@/lib/validations';
import { z } from 'zod';
import { PlayerRole, Team, WinnerTeam } from '@prisma/client';

export class GameService {
  async getGames(
    page: number = 1,
    limit: number = 20,
    playerId?: string,
    tournamentId?: string,
    dateFrom?: string,
    dateTo?: string
  ) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (playerId) {
      where.participations = {
        some: {
          playerId,
        },
      };
    }

    if (tournamentId) {
      where.tournamentId = tournamentId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        (where.date as { gte: Date }).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.date as { lte: Date }).lte = new Date(dateTo);
      }
    }

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        skip,
        take: limit,
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
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
      }),
      prisma.game.count({ where }),
    ]);

    return {
      data: games,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getGameById(id: string) {
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        },
        participations: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                eloRating: true,
                club: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    return game;
  }

  async createGame(data: z.infer<typeof GameSchema>, tournamentId?: string) {
    const validatedData = GameSchema.parse(data);

    const game = await prisma.game.create({
      data: {
        ...validatedData,
        tournamentId,
      },
      include: {
        tournament: true,
        participations: {
          include: {
            player: true,
          },
        },
      },
    });

    return game;
  }

  async updateGame(id: string, data: Partial<z.infer<typeof GameSchema>>) {
    const validatedData = GameSchema.partial().parse(data);

    const game = await prisma.game.update({
      where: { id },
      data: validatedData,
      include: {
        tournament: true,
        participations: {
          include: {
            player: true,
          },
        },
      },
    });

    return game;
  }

  async deleteGame(id: string) {
    await prisma.game.delete({
      where: { id },
    });
  }

  async addPlayerToGame(
    gameId: string,
    playerId: string,
    role: string,
    team: string
  ) {
    const participation = await prisma.gameParticipation.create({
      data: {
        gameId,
        playerId,
        role: role as PlayerRole,
        team: team as Team,
        isWinner: false,
      },
      include: {
        player: true,
        game: true,
      },
    });

    return participation;
  }

  async updateGameResult(gameId: string, winnerTeam: string) {
    const game = await prisma.game.update({
      where: { id: gameId },
      data: {
        winnerTeam: winnerTeam as WinnerTeam,
        status: 'COMPLETED',
      },
      include: {
        participations: true,
      },
    });

    // Update player statistics
    await this.updatePlayerStats(game);

    return game;
  }

  private async updatePlayerStats(game: Record<string, unknown>) {
    const participations = game.participations as Array<{
      playerId: string;
      team: string;
      role: string;
      isWinner: boolean;
    }>;

    for (const participation of participations) {
      const isWinner = participation.team === game.winnerTeam;

      // Update player stats
      await prisma.player.update({
        where: { id: participation.playerId },
        data: {
          totalGames: { increment: 1 },
          wins: isWinner ? { increment: 1 } : undefined,
          losses: !isWinner ? { increment: 1 } : undefined,
          eloRating: isWinner ? { increment: 25 } : { decrement: 25 },
        },
      });

      // Update role stats
      await prisma.playerRoleStats.upsert({
        where: {
          playerId_role: {
            playerId: participation.playerId,
            role: participation.role as PlayerRole,
          },
        },
        update: {
          gamesPlayed: { increment: 1 },
          wins: isWinner ? { increment: 1 } : undefined,
          losses: !isWinner ? { increment: 1 } : undefined,
          lastPlayed: new Date(),
        },
        create: {
          playerId: participation.playerId,
          role: participation.role as PlayerRole,
          gamesPlayed: 1,
          wins: isWinner ? 1 : 0,
          losses: !isWinner ? 1 : 0,
          winRate: isWinner ? 1 : 0,
          lastPlayed: new Date(),
        },
      });
    }
  }
}
