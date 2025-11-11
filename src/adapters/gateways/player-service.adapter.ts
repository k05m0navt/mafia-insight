import { Prisma, RoleStat } from '@prisma/client';
import { prisma as db } from '@/lib/db';
import { PlayerService } from '@/services/playerService';
import type {
  GetPlayerAnalyticsRequest,
  GetPlayerProfileRequest,
  ListPlayersRequest,
  ListPlayersResponse,
  PlayerAnalyticsResponse,
  PlayerProfileResponse,
} from '@/application/contracts';
import {
  PlayerAnalyticsPort,
  PlayerProfilePort,
  PlayerQueryPort,
} from '@/application/ports';
import { ApplicationNotFoundError } from '@/application/errors';
import { RedisCacheAdapter } from '@/infrastructure/caching';
import { SupabaseMessageBusAdapter } from '@/infrastructure/messaging';

type PlayerRecord = Prisma.PlayerGetPayload<{
  select: typeof playerSelect;
}>;

const playerSelect = {
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
} satisfies Prisma.PlayerSelect;

export class PlayerServiceAdapter
  implements PlayerQueryPort, PlayerAnalyticsPort, PlayerProfilePort
{
  private readonly playerService = new PlayerService();
  private readonly cache = new RedisCacheAdapter();
  private readonly messageBus = new SupabaseMessageBusAdapter();
  private static readonly CACHE_TTL_SECONDS = 60;

  async listPlayers(request: ListPlayersRequest): Promise<ListPlayersResponse> {
    const normalizedRequest: ListPlayersRequest = {
      page: request.page ?? 1,
      limit: request.limit ?? 20,
      search: request.search ?? undefined,
      clubId: request.clubId ?? undefined,
      sortBy: request.sortBy ?? 'lastSyncAt',
      sortOrder: request.sortOrder ?? 'desc',
      syncStatus: request.syncStatus ?? undefined,
    };

    const cacheKey = this.buildCacheKey('players:list', normalizedRequest);
    const cached = await this.cache.get<ListPlayersResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const page = normalizedRequest.page ?? 1;
    const limit = normalizedRequest.limit ?? 20;
    const skip = (page - 1) * limit;

    const baseWhere: Prisma.PlayerWhereInput = {};

    if (normalizedRequest.clubId) {
      baseWhere.clubId = normalizedRequest.clubId;
    }

    if (normalizedRequest.syncStatus) {
      baseWhere.syncStatus = { equals: normalizedRequest.syncStatus };
    }

    const orderBy: Prisma.PlayerOrderByWithRelationInput = {
      [normalizedRequest.sortBy ?? 'lastSyncAt']:
        normalizedRequest.sortOrder ?? 'desc',
    };

    let players: PlayerRecord[] = [];
    let total = 0;

    if (normalizedRequest.search) {
      const exactWhere: Prisma.PlayerWhereInput = {
        ...baseWhere,
        name: { equals: normalizedRequest.search, mode: 'insensitive' },
      };

      const allMatchesWhere: Prisma.PlayerWhereInput = {
        ...baseWhere,
        name: { contains: normalizedRequest.search, mode: 'insensitive' },
      };

      const fetchLimit = Math.min(1000, limit * 10);

      const [exactMatches, allMatches, allCount] = await Promise.all([
        db.player.findMany({
          where: exactWhere,
          orderBy,
          select: playerSelect,
        }),
        db.player.findMany({
          where: allMatchesWhere,
          orderBy,
          take: fetchLimit,
          select: playerSelect,
        }),
        db.player.count({ where: allMatchesWhere }),
      ]);

      const exactIds = new Set(exactMatches.map((player) => player.id));
      const partialMatches = allMatches.filter(
        (player) => !exactIds.has(player.id)
      );

      const combined = [...exactMatches, ...partialMatches];
      players = combined.slice(skip, skip + limit);
      total = allCount;
    } else {
      const [allPlayers, totalCount] = await Promise.all([
        db.player.findMany({
          where: baseWhere,
          orderBy,
          skip,
          take: limit,
          select: playerSelect,
        }),
        db.player.count({ where: baseWhere }),
      ]);
      players = allPlayers;
      total = totalCount;
    }

    const totalPages = Math.ceil(total / limit);

    const response: ListPlayersResponse = {
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
        lastSyncAt: player.lastSyncAt ? player.lastSyncAt.toISOString() : null,
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

    await this.cache.set(cacheKey, response, {
      ttlSeconds: PlayerServiceAdapter.CACHE_TTL_SECONDS,
      tags: ['players'],
    });

    return response;
  }

  async getPlayerAnalytics(
    request: GetPlayerAnalyticsRequest
  ): Promise<PlayerAnalyticsResponse> {
    const playerId = request.playerId;
    const cacheKey = `players:analytics:${playerId}`;
    const cached = await this.cache.get<PlayerAnalyticsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    let analytics;
    try {
      analytics = await this.playerService.getPlayerAnalytics(playerId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new ApplicationNotFoundError('Player not found');
      }
      throw error;
    }

    const roleStats = Array.isArray(analytics.roleStats)
      ? (analytics.roleStats as RoleStat[])
      : [];

    const recentGames = (analytics.recentGames ?? []).map((game) => ({
      gameId: game.gameId,
      date: new Date(game.date).toISOString(),
      role: game.role,
      team: game.team,
      isWinner: game.isWinner,
      performanceScore: game.performanceScore,
      gameStatus: game.gameStatus,
      winnerTeam: game.winnerTeam,
    }));

    const response: PlayerAnalyticsResponse = {
      player: {
        id: analytics.player.id,
        name: analytics.player.name,
        region: analytics.player.region ?? null,
        eloRating: analytics.player.eloRating,
        totalGames: analytics.player.totalGames,
        wins: analytics.player.wins,
        losses: analytics.player.losses,
      },
      overallStats: analytics.overallStats,
      roleStats: roleStats.map((roleStat) => ({
        role: roleStat.role ?? 'UNKNOWN',
        gamesPlayed: roleStat.gamesPlayed ?? 0,
        wins: roleStat.wins ?? 0,
        losses: roleStat.losses ?? 0,
        winRate: roleStat.winRate ?? 0,
      })),
      recentGames,
    };

    await this.cache.set(cacheKey, response, {
      ttlSeconds: PlayerServiceAdapter.CACHE_TTL_SECONDS,
      tags: [`player:${playerId}`, 'player-analytics'],
    });

    await this.messageBus.publish({
      topic: 'player.analytics.generated',
      payload: {
        playerId,
        generatedAt: new Date().toISOString(),
      },
    });

    return response;
  }

  async getPlayerProfile({
    playerId,
    year,
  }: GetPlayerProfileRequest): Promise<PlayerProfileResponse> {
    const cacheKey = this.buildCacheKey('players:profile', {
      playerId,
      year: year ?? null,
    });
    const cached = await this.cache.get<PlayerProfileResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const player = await db.player.findUnique({
      where: { id: playerId },
      select: playerProfileSelect,
    });

    if (!player) {
      throw new ApplicationNotFoundError('Player not found');
    }

    const recentGames = player.participations.slice(0, 5).map(({ game }) => ({
      game: {
        id: game.id,
        gomafiaId: game.gomafiaId ?? null,
        date: game.date.toISOString(),
        status: game.status,
        winnerTeam: game.winnerTeam,
        durationMinutes: game.durationMinutes ?? null,
      },
    }));

    let wins = player.wins;
    let losses = player.losses;
    let totalGames = player.totalGames;

    if (typeof year === 'number') {
      const yearParticipations = await db.gameParticipation.findMany({
        where: {
          playerId,
          game: {
            date: {
              gte: new Date(`${year}-01-01`),
              lt: new Date(`${year + 1}-01-01`),
            },
          },
        },
        select: {
          isWinner: true,
        },
      });

      wins = yearParticipations.filter((p) => p.isWinner).length;
      losses = yearParticipations.length - wins;
      totalGames = wins + losses;
    }

    const winRate =
      totalGames > 0
        ? Math.round(((wins / totalGames) * 100 + Number.EPSILON) * 100) / 100
        : 0;

    const roleStats = await this.resolveRoleStats(playerId, year, player);

    const availableYearsRaw = await db.playerYearStats.findMany({
      where: { playerId },
      select: { year: true },
      orderBy: { year: 'desc' },
    });

    const availableYears = Array.from(
      new Set(availableYearsRaw.map((record) => record.year))
    ).sort((a, b) => b - a);

    const profile: PlayerProfileResponse = {
      id: player.id,
      gomafiaId: player.gomafiaId ?? null,
      name: player.name,
      eloRating: player.eloRating,
      totalGames,
      wins,
      losses,
      lastSyncAt: player.lastSyncAt?.toISOString() ?? null,
      syncStatus: player.syncStatus ?? null,
      clubId: player.clubId ?? null,
      club: player.club
        ? { id: player.club.id, name: player.club.name ?? null }
        : null,
      judgeCategory: player.judgeCategory ?? null,
      judgeCanBeGs: player.judgeCanBeGs ?? null,
      judgeCanJudgeFinal: player.judgeCanJudgeFinal ?? false,
      judgeMaxTablesAsGs: player.judgeMaxTablesAsGs ?? null,
      judgeRating: player.judgeRating ?? null,
      judgeGamesJudged: player.judgeGamesJudged ?? null,
      judgeAccreditationDate: player.judgeAccreditationDate
        ? player.judgeAccreditationDate.toISOString()
        : null,
      judgeResponsibleFromSc: player.judgeResponsibleFromSc ?? null,
      statistics: {
        totalGames,
        winRate,
        recentGames,
        roleStats,
      },
      availableYears,
    };

    await this.cache.set(cacheKey, profile, {
      ttlSeconds: PlayerServiceAdapter.CACHE_TTL_SECONDS,
      tags: [`player:${playerId}`, 'player-profiles'],
    });

    await this.messageBus.publish({
      topic: 'player.profile.requested',
      payload: {
        playerId,
        year: year ?? null,
        generatedAt: new Date().toISOString(),
      },
    });

    return profile;
  }

  private async resolveRoleStats(
    playerId: string,
    year: number | undefined,
    player: PlayerRecord
  ): Promise<
    Record<
      string,
      {
        gamesPlayed: number;
        wins: number;
        losses: number;
        winRate: number;
      }
    >
  > {
    if (typeof year === 'number') {
      const participations = await db.gameParticipation.findMany({
        where: {
          playerId,
          game: {
            date: {
              gte: new Date(`${year}-01-01`),
              lt: new Date(`${year + 1}-01-01`),
            },
          },
        },
        select: {
          role: true,
          isWinner: true,
        },
      });

      return participations.reduce(
        (acc, participation) => {
          const role = participation.role ?? 'UNKNOWN';
          if (!acc[role]) {
            acc[role] = {
              gamesPlayed: 0,
              wins: 0,
              losses: 0,
              winRate: 0,
            };
          }

          acc[role].gamesPlayed += 1;
          if (participation.isWinner) {
            acc[role].wins += 1;
          } else {
            acc[role].losses += 1;
          }

          acc[role].winRate =
            acc[role].gamesPlayed > 0
              ? Math.round(
                  ((acc[role].wins / acc[role].gamesPlayed) * 100 +
                    Number.EPSILON) *
                    100
                ) / 100
              : 0;

          return acc;
        },
        {} as Record<
          string,
          {
            gamesPlayed: number;
            wins: number;
            losses: number;
            winRate: number;
          }
        >
      );
    }

    return player.roleStats.reduce(
      (acc, stat) => {
        acc[stat.role] = {
          gamesPlayed: stat.gamesPlayed,
          wins: stat.wins,
          losses: stat.losses,
          winRate:
            stat.gamesPlayed > 0
              ? Math.round(
                  ((stat.wins / stat.gamesPlayed) * 100 + Number.EPSILON) * 100
                ) / 100
              : 0,
        };
        return acc;
      },
      {} as Record<
        string,
        {
          gamesPlayed: number;
          wins: number;
          losses: number;
          winRate: number;
        }
      >
    );
  }

  private buildCacheKey(namespace: string, payload: unknown): string {
    const serialized = JSON.stringify(payload);
    return `${namespace}:${Buffer.from(serialized).toString('base64url')}`;
  }
}

const playerProfileSelect = {
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
  judgeCategory: true,
  judgeCanBeGs: true,
  judgeCanJudgeFinal: true,
  judgeMaxTablesAsGs: true,
  judgeRating: true,
  judgeGamesJudged: true,
  judgeAccreditationDate: true,
  judgeResponsibleFromSc: true,
  participations: {
    select: {
      game: {
        select: {
          id: true,
          gomafiaId: true,
          date: true,
          status: true,
          winnerTeam: true,
          durationMinutes: true,
        },
      },
    },
    orderBy: {
      game: {
        date: 'desc',
      },
    },
  },
  roleStats: {
    select: {
      role: true,
      gamesPlayed: true,
      wins: true,
      losses: true,
    },
  },
} satisfies Prisma.PlayerSelect;
