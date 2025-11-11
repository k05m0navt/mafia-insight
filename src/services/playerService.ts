import { Player } from '@/domain/entities/player';
import { DomainNotFoundError, DomainValidationError } from '@/domain/errors';
import { PlayerAnalyticsService } from '@/domain/services/player-analytics-service';
import {
  PlayerDomainService,
  PlayerListQuery,
  PlayerReadRepository,
} from '@/domain/services/player-domain-service';
import { prisma } from '@/lib/db';
import { PlayerSchema, PlayerUpdateSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

class PrismaPlayerRepository implements PlayerReadRepository {
  async findById(id: string): Promise<Player | null> {
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        participations: {
          include: {
            game: true,
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

    return player ? mapPrismaPlayerToDomain(player) : null;
  }

  async list(query: PlayerListQuery) {
    const { page, limit, search, clubId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PlayerWhereInput = {
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
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

    const domainPlayers = players.map(mapPrismaPlayerToDomain);

    return {
      players: domainPlayers,
      total,
      page,
      limit,
    };
  }
}

export class PlayerService {
  private readonly repository = new PrismaPlayerRepository();
  private readonly domain = new PlayerDomainService(this.repository);

  async getPlayers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    clubId?: string
  ) {
    const prismaPlayers = await prisma.player.findMany({
      where: {
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }),
        ...(clubId && { clubId }),
      },
      skip: (page - 1) * limit,
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
    });

    const total = await prisma.player.count({
      where: {
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }),
        ...(clubId && { clubId }),
      },
    });

    const players = prismaPlayers.map((player) => ({
      ...player,
      winRate: mapPrismaPlayerToDomain(player).winRate,
    }));

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
      throw new DomainNotFoundError('Player', id);
    }

    return {
      ...player,
      winRate: mapPrismaPlayerToDomain(player).winRate,
    };
  }

  async createPlayer(data: z.infer<typeof PlayerSchema>, userId: string) {
    const validatedData = PlayerSchema.parse(data);

    // Validate business invariants through the domain entity
    new Player({
      id: validatedData.id,
      name: validatedData.name,
      totalGames: validatedData.totalGames,
      wins: validatedData.wins,
      losses: validatedData.losses,
      eloRating: validatedData.eloRating,
      region: validatedData.region,
    });

    const player = await prisma.player.create({
      data: {
        id: validatedData.id,
        userId,
        gomafiaId: validatedData.gomafiaId || validatedData.id,
        name: validatedData.name,
        eloRating: validatedData.eloRating,
        totalGames: validatedData.totalGames,
        wins: validatedData.wins,
        losses: validatedData.losses,
        region: validatedData.region,
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

    const existing = await prisma.player.findUnique({ where: { id } });

    if (!existing) {
      throw new DomainNotFoundError('Player', id);
    }

    const merged = {
      totalGames: validatedData.totalGames ?? existing.totalGames,
      wins: validatedData.wins ?? existing.wins,
      losses: validatedData.losses ?? existing.losses,
      eloRating: validatedData.eloRating ?? existing.eloRating,
      region: validatedData.region ?? existing.region,
      name: validatedData.name ?? existing.name,
    };

    try {
      new Player({
        id: existing.id,
        name: merged.name,
        totalGames: merged.totalGames,
        wins: merged.wins,
        losses: merged.losses,
        eloRating: merged.eloRating,
        region: merged.region,
      });
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw error;
      }
      throw error;
    }

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

    return {
      ...player,
      winRate: mapPrismaPlayerToDomain(player).winRate,
    };
  }

  async deletePlayer(id: string) {
    await prisma.player.delete({
      where: { id },
    });
  }

  async getPlayerAnalytics(playerId: string) {
    const player = await this.domain.getPlayerById(playerId);
    const analytics = PlayerAnalyticsService.buildOverview(player);

    const rawPlayer = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
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
        },
      },
    });

    return {
      player: rawPlayer,
      overallStats: analytics.overall,
      roleStats: rawPlayer?.roleStats ?? [],
      recentGames: analytics.recentGames.map((game) => ({
        gameId: game.id,
        date: game.date,
        role: game.role,
        team: game.team,
        isWinner: game.isWinner,
        performanceScore: game.performanceScore,
        gameStatus: game.gameStatus,
        winnerTeam: game.winnerTeam,
      })),
    };
  }
}

type PrismaPlayerWithParticipations = Prisma.PlayerGetPayload<{
  include: {
    participations: {
      include: {
        game: true;
      };
    };
  };
}>;

type ParticipationWithGame =
  PrismaPlayerWithParticipations['participations'][number];

function hasParticipations(
  player: Prisma.Player | PrismaPlayerWithParticipations
): player is PrismaPlayerWithParticipations {
  return 'participations' in player;
}

function mapPrismaPlayerToDomain(
  player: Prisma.Player | PrismaPlayerWithParticipations
): Player {
  const participationsRaw = hasParticipations(player)
    ? player.participations
    : [];

  return new Player({
    id: player.id,
    name: player.name,
    totalGames: player.totalGames,
    wins: player.wins,
    losses: player.losses,
    eloRating: player.eloRating,
    region: player.region,
    participations: participationsRaw.map(
      (participation: ParticipationWithGame) => ({
        id: participation.id,
        date: participation.game?.date ?? new Date(),
        role: participation.role,
        team: participation.team,
        isWinner: participation.isWinner,
        performanceScore: participation.performanceScore ?? 0,
        gameStatus: participation.game?.status ?? 'unknown',
        winnerTeam: participation.game?.winnerTeam ?? null,
      })
    ),
  });
}
