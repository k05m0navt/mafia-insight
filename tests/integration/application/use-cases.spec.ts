import { describe, it, expect } from 'vitest';
import {
  ListPlayersUseCase,
  GetPlayerAnalyticsUseCase,
  GetPlayerProfileUseCase,
  GetTournamentAnalyticsUseCase,
  GetClubAnalyticsUseCase,
  CreateAdminUserUseCase,
} from '@/application/use-cases';
import type {
  ListPlayersRequest,
  ListPlayersResponse,
  PlayerAnalyticsResponse,
  PlayerProfileResponse,
  GetPlayerProfileRequest,
  TournamentAnalyticsResponse,
  ClubAnalyticsResponse,
  CreateAdminUserRequest,
} from '@/application/contracts';
import {
  PlayerQueryPort,
  PlayerAnalyticsPort,
  PlayerProfilePort,
  TournamentAnalyticsPort,
  ClubAnalyticsPort,
  AdminUserManagementPort,
} from '@/application/ports';
import {
  ApplicationValidationError,
  ApplicationNotFoundError,
} from '@/application/errors';

class InMemoryPlayerQueryPort implements PlayerQueryPort {
  public received: ListPlayersRequest | null = null;

  constructor(private readonly response: ListPlayersResponse) {}

  async listPlayers(request: ListPlayersRequest): Promise<ListPlayersResponse> {
    this.received = request;
    return this.response;
  }
}

class InMemoryPlayerAnalyticsPort implements PlayerAnalyticsPort {
  public receivedId: string | null = null;

  constructor(private readonly response: PlayerAnalyticsResponse | null) {}

  async getPlayerAnalytics({
    playerId,
  }: {
    playerId: string;
  }): Promise<PlayerAnalyticsResponse> {
    this.receivedId = playerId;
    if (!this.response) {
      throw new ApplicationNotFoundError('Player analytics not found');
    }
    return this.response;
  }
}

class InMemoryPlayerProfilePort implements PlayerProfilePort {
  public received: GetPlayerProfileRequest | null = null;

  constructor(private readonly response: PlayerProfileResponse) {}

  async getPlayerProfile(
    request: GetPlayerProfileRequest
  ): Promise<PlayerProfileResponse> {
    this.received = request;
    return this.response;
  }
}

class InMemoryTournamentAnalyticsPort implements TournamentAnalyticsPort {
  public receivedId: string | null = null;

  constructor(private readonly response: TournamentAnalyticsResponse) {}

  async getTournamentAnalytics({ tournamentId }: { tournamentId: string }) {
    this.receivedId = tournamentId;
    return this.response;
  }
}

class InMemoryClubAnalyticsPort implements ClubAnalyticsPort {
  public receivedId: string | null = null;

  constructor(private readonly response: ClubAnalyticsResponse) {}

  async getClubAnalytics({ clubId }: { clubId: string }) {
    this.receivedId = clubId;
    return this.response;
  }
}

class InMemoryAdminPort implements AdminUserManagementPort {
  public received: CreateAdminUserRequest | null = null;

  async createAdminUser(request: CreateAdminUserRequest) {
    this.received = request;
    return {
      user: {
        id: 'admin-123',
        email: request.email,
        name: request.name,
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      message: 'Admin user created',
    };
  }
}

describe('Application Use Cases', () => {
  it('normalizes pagination input for ListPlayersUseCase', async () => {
    const port = new InMemoryPlayerQueryPort({
      players: [],
      pagination: {
        page: 1,
        limit: 100,
        total: 0,
        pages: 0,
      },
    });

    const useCase = new ListPlayersUseCase(port);
    const result = await useCase.execute({ page: 0, limit: 500 });

    expect(result.pagination.limit).toBe(100);
    expect(port.received).toEqual({
      page: 1,
      limit: 100,
      sortBy: 'lastSyncAt',
      sortOrder: 'desc',
      search: undefined,
      clubId: undefined,
      syncStatus: undefined,
    });
  });

  it('throws when analytics are missing for GetPlayerAnalyticsUseCase', async () => {
    const useCase = new GetPlayerAnalyticsUseCase(
      new InMemoryPlayerAnalyticsPort(null)
    );

    await expect(
      useCase.execute({ playerId: 'missing-player' })
    ).rejects.toBeInstanceOf(ApplicationNotFoundError);
  });

  it('fetches player analytics with trimmed identifier', async () => {
    const port = new InMemoryPlayerAnalyticsPort({
      player: {
        id: 'player-1',
        name: 'Night Fox',
        region: 'EU',
        eloRating: 1600,
        totalGames: 10,
        wins: 6,
        losses: 4,
      },
      overallStats: {
        totalGames: 10,
        wins: 6,
        losses: 4,
        winRate: 60,
        eloRating: 1600,
      },
      roleStats: [],
      recentGames: [],
    });

    const useCase = new GetPlayerAnalyticsUseCase(port);
    const result = await useCase.execute({ playerId: '  player-1  ' });

    expect(result.player.id).toBe('player-1');
    expect(port.receivedId).toBe('player-1');
  });

  it('returns tournament analytics using the requested identifier', async () => {
    const port = new InMemoryTournamentAnalyticsPort({
      tournament: {
        id: 't-1',
        name: 'Championship',
        status: 'COMPLETED',
        startDate: null,
        endDate: null,
        gamesHosted: 5,
      },
      gamesPlayed: 5,
      averageDuration: 42,
      winnerDistribution: { blackWins: 2, redWins: 2, draws: 1 },
      participantStats: [],
      topPerformers: [],
    });

    const useCase = new GetTournamentAnalyticsUseCase(port);
    const result = await useCase.execute({ tournamentId: 't-1' });

    expect(result.gamesPlayed).toBe(5);
    expect(port.receivedId).toBe('t-1');
  });

  it('returns club analytics data', async () => {
    const port = new InMemoryClubAnalyticsPort({
      club: {
        id: 'club-1',
        name: 'Night Watch',
        region: 'EU',
        description: null,
      },
      memberCount: 10,
      totalGames: 200,
      totalWins: 120,
      winRate: 60,
      averageElo: 1500,
      roleDistribution: {},
      topPerformers: [],
    });

    const useCase = new GetClubAnalyticsUseCase(port);
    const result = await useCase.execute({ clubId: 'club-1' });

    expect(result.memberCount).toBe(10);
    expect(port.receivedId).toBe('club-1');
  });

  it('normalizes identifiers for player profile use case', async () => {
    const response: PlayerProfileResponse = {
      id: 'player-1',
      gomafiaId: null,
      name: 'Night Fox',
      eloRating: 1500,
      totalGames: 20,
      wins: 12,
      losses: 8,
      lastSyncAt: null,
      syncStatus: null,
      clubId: null,
      club: null,
      judgeCategory: null,
      judgeCanBeGs: null,
      judgeCanJudgeFinal: false,
      judgeMaxTablesAsGs: null,
      judgeRating: null,
      judgeGamesJudged: null,
      judgeAccreditationDate: null,
      judgeResponsibleFromSc: null,
      statistics: {
        totalGames: 20,
        winRate: 60,
        recentGames: [],
        roleStats: {},
      },
      availableYears: [2025, 2024],
    };

    const port = new InMemoryPlayerProfilePort(response);
    const useCase = new GetPlayerProfileUseCase(port);

    const result = await useCase.execute({
      playerId: '  player-1  ',
      year: 2025,
    });

    expect(result.id).toBe('player-1');
    expect(port.received).toEqual({ playerId: 'player-1', year: 2025 });
  });

  it('rejects missing identifiers for player profile use case', async () => {
    const response: PlayerProfileResponse = {
      id: 'player-1',
      gomafiaId: null,
      name: 'Night Fox',
      eloRating: 1500,
      totalGames: 20,
      wins: 12,
      losses: 8,
      lastSyncAt: null,
      syncStatus: null,
      clubId: null,
      club: null,
      judgeCategory: null,
      judgeCanBeGs: null,
      judgeCanJudgeFinal: false,
      judgeMaxTablesAsGs: null,
      judgeRating: null,
      judgeGamesJudged: null,
      judgeAccreditationDate: null,
      judgeResponsibleFromSc: null,
      statistics: {
        totalGames: 20,
        winRate: 60,
        recentGames: [],
        roleStats: {},
      },
      availableYears: [],
    };

    const useCase = new GetPlayerProfileUseCase(
      new InMemoryPlayerProfilePort(response)
    );

    await expect(useCase.execute({ playerId: '   ' })).rejects.toBeInstanceOf(
      ApplicationValidationError
    );
  });

  it('validates year bounds for player profile use case', async () => {
    const response: PlayerProfileResponse = {
      id: 'player-1',
      gomafiaId: null,
      name: 'Night Fox',
      eloRating: 1500,
      totalGames: 20,
      wins: 12,
      losses: 8,
      lastSyncAt: null,
      syncStatus: null,
      clubId: null,
      club: null,
      judgeCategory: null,
      judgeCanBeGs: null,
      judgeCanJudgeFinal: false,
      judgeMaxTablesAsGs: null,
      judgeRating: null,
      judgeGamesJudged: null,
      judgeAccreditationDate: null,
      judgeResponsibleFromSc: null,
      statistics: {
        totalGames: 20,
        winRate: 60,
        recentGames: [],
        roleStats: {},
      },
      availableYears: [],
    };

    const useCase = new GetPlayerProfileUseCase(
      new InMemoryPlayerProfilePort(response)
    );

    await expect(
      useCase.execute({ playerId: 'player-1', year: 1800 })
    ).rejects.toBeInstanceOf(ApplicationValidationError);
  });

  it('validates create admin requests', async () => {
    const port = new InMemoryAdminPort();
    const useCase = new CreateAdminUserUseCase(port);

    await expect(
      useCase.execute({
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'short',
      })
    ).rejects.toBeInstanceOf(ApplicationValidationError);
  });
});
