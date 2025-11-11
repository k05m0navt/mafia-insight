import { Prisma } from '@prisma/client';
import { Player } from '@/domain/entities/player';
import type {
  ListPlayersRequest,
  ListPlayersResponse,
} from '@/application/contracts';
import type { PlayerPersistencePort } from '@/application/ports';
import { db } from '@/lib/db';

type PlayerWithRelations = Prisma.PlayerGetPayload<{
  include: {
    participations: {
      include: {
        game: true;
      };
      orderBy: {
        game: {
          date: 'desc';
        };
      };
      take: number;
    };
    roleStats: true;
  };
}>;

export class PrismaPlayerPersistenceAdapter implements PlayerPersistencePort {
  async getById(id: string): Promise<Player | null> {
    const record = await db.player.findUnique({
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
        roleStats: true,
      },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async list(request: ListPlayersRequest): Promise<ListPlayersResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PlayerWhereInput = {
      ...(request.search && {
        name: {
          contains: request.search,
          mode: 'insensitive',
        },
      }),
      ...(request.clubId && { clubId: request.clubId }),
      ...(request.syncStatus && { syncStatus: request.syncStatus }),
    };

    const orderBy: Prisma.PlayerOrderByWithRelationInput = {
      [request.sortBy ?? 'lastSyncAt']: request.sortOrder ?? 'desc',
    };

    const [players, total] = await Promise.all([
      db.player.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          gomafiaId: true,
          name: true,
          eloRating: true,
          totalGames: true,
          wins: true,
          losses: true,
          lastSyncAt: true,
          syncStatus: true,
          clubId: true,
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      db.player.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      players: players.map((player) => ({
        id: player.id,
        name: player.name,
        gomafiaId: player.gomafiaId ?? null,
        eloRating: player.eloRating,
        totalGames: player.totalGames,
        wins: player.wins,
        losses: player.losses,
        winRate:
          player.totalGames > 0 ? (player.wins / player.totalGames) * 100 : 0,
        lastSyncAt: player.lastSyncAt?.toISOString() ?? null,
        syncStatus: player.syncStatus ?? null,
        clubId: player.clubId ?? null,
        clubName: player.club?.name ?? null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async save(player: Player): Promise<void> {
    const primitives = player.toPrimitives();

    await db.player.update({
      where: { id: primitives.id },
      data: {
        name: primitives.name,
        eloRating: primitives.eloRating,
        totalGames: primitives.totalGames,
        wins: primitives.wins,
        losses: primitives.losses,
        region: primitives.region ?? null,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await db.player.delete({
      where: { id },
    });
  }

  private toDomain(record: PlayerWithRelations): Player {
    return new Player({
      id: record.id,
      name: record.name,
      totalGames: record.totalGames,
      wins: record.wins,
      losses: record.losses,
      eloRating: record.eloRating,
      region: record.region,
      participations: record.participations.map((participation) => ({
        id: participation.id,
        date: participation.game?.date ?? new Date(),
        role: participation.role ?? 'UNKNOWN',
        team: participation.team ?? 'UNKNOWN',
        isWinner: participation.isWinner ?? false,
        performanceScore: participation.performanceScore ?? 0,
        gameStatus: participation.game?.status ?? 'unknown',
        winnerTeam: participation.game?.winnerTeam ?? null,
      })),
    });
  }
}
