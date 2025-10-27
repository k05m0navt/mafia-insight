import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, PlayerRole } from '@prisma/client';
import { chromium, Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { StatisticsPhase } from '@/lib/gomafia/import/phases/statistics-phase';

describe('StatisticsPhase Integration Tests', () => {
  let db: PrismaClient;
  let browser: Browser;
  let orchestrator: ImportOrchestrator;

  beforeEach(async () => {
    db = new PrismaClient();
    browser = await chromium.launch({ headless: true });
    orchestrator = new ImportOrchestrator(db, browser);

    // Clean up test data
    await db.playerRoleStats.deleteMany({});
    await db.gameParticipation.deleteMany({});
    await db.game.deleteMany({});
    await db.player.deleteMany({});
    await db.tournament.deleteMany({});
  });

  afterEach(async () => {
    await browser.close();
    await db.$disconnect();
  });

  it('should calculate PlayerRoleStats from games', async () => {
    // Create test player
    const player = await db.player.create({
      data: {
        id: 'test-player-stats-calc',
        userId: 'test-user',
        gomafiaId: '999',
        name: 'Test Player Stats Calc',
        eloRating: 1200,
        totalGames: 0,
        wins: 0,
        losses: 0,
      },
    });

    // Create test tournament
    const tournament = await db.tournament.create({
      data: {
        id: 'test-tournament-stats',
        gomafiaId: 'test-tournament-stats-1',
        name: 'Test Tournament Stats',
        stars: 3,
        averageElo: 1500,
        isFsmRated: true,
        startDate: new Date('2024-01-01'),
        status: 'COMPLETED',
        createdBy: 'test-user',
      },
    });

    // Create test games with participations
    const game1 = await db.game.create({
      data: {
        id: 'test-game-stats-1',
        gomafiaId: 'game-stats-1',
        tournamentId: tournament.id,
        date: new Date('2024-01-02'),
        durationMinutes: 45,
        winnerTeam: 'MAFIA',
        status: 'COMPLETED',
      },
    });

    const game2 = await db.game.create({
      data: {
        id: 'test-game-stats-2',
        gomafiaId: 'game-stats-2',
        tournamentId: tournament.id,
        date: new Date('2024-01-03'),
        durationMinutes: 50,
        winnerTeam: 'CITIZENS',
        status: 'COMPLETED',
      },
    });

    // Create participations (player played as DON twice, won once)
    await db.gameParticipation.createMany({
      data: [
        {
          id: 'participation-1',
          playerId: player.id,
          gameId: game1.id,
          role: 'DON' as PlayerRole,
          team: 'MAFIA',
          isWinner: true,
          performanceScore: 8.5,
        },
        {
          id: 'participation-2',
          playerId: player.id,
          gameId: game2.id,
          role: 'DON' as PlayerRole,
          team: 'MAFIA',
          isWinner: false,
          performanceScore: 6.0,
        },
      ],
    });

    const phase = new StatisticsPhase(orchestrator);

    // Execute phase
    await phase.execute();

    // Verify phase name
    expect(phase.getPhaseName()).toBe('STATISTICS');

    // Verify PlayerRoleStats was created
    const roleStats = await db.playerRoleStats.findUnique({
      where: {
        playerId_role: {
          playerId: player.id,
          role: 'DON' as PlayerRole,
        },
      },
    });

    expect(roleStats).toBeDefined();
    expect(roleStats?.gamesPlayed).toBe(2);
    expect(roleStats?.wins).toBe(1);
    expect(roleStats?.losses).toBe(1);
    expect(roleStats?.winRate).toBeCloseTo(50, 1); // 50%
    expect(roleStats?.averagePerformance).toBeCloseTo(7.25, 1); // (8.5 + 6.0) / 2
    expect(roleStats?.lastPlayed).toEqual(game2.date);
  });

  it('should create proper checkpoint structure', () => {
    const phase = new StatisticsPhase(orchestrator);

    const checkpoint = phase.createCheckpoint(4, 6, [
      'player1',
      'player2',
      'player3',
    ]);

    expect(checkpoint.phase).toBe('STATISTICS');
    expect(checkpoint.lastBatchIndex).toBe(4);
    expect(checkpoint.totalBatches).toBe(6);
    expect(checkpoint.processedIds).toEqual(['player1', 'player2', 'player3']);
    expect(checkpoint.message).toContain('batch 5/6');
    expect(checkpoint.timestamp).toBeDefined();
  });

  it('should handle players with no games gracefully', async () => {
    // Create player with no games
    await db.player.create({
      data: {
        id: 'test-player-stats-calc-2',
        userId: 'test-user',
        gomafiaId: '888',
        name: 'Test Player No Games',
        eloRating: 1200,
        totalGames: 0,
        wins: 0,
        losses: 0,
      },
    });

    const phase = new StatisticsPhase(orchestrator);

    // Should not throw error
    await expect(phase.execute()).resolves.not.toThrow();

    // Verify no stats were created
    const statsCount = await db.playerRoleStats.count();
    expect(statsCount).toBe(0);
  });

  it('should calculate stats for multiple roles', async () => {
    // Create test player
    const player = await db.player.create({
      data: {
        id: 'test-player-multi-role',
        userId: 'test-user',
        gomafiaId: '777',
        name: 'Test Player Multi Role',
        eloRating: 1200,
        totalGames: 0,
        wins: 0,
        losses: 0,
      },
    });

    // Create test tournament
    const tournament = await db.tournament.create({
      data: {
        id: 'test-tournament-multi-role',
        gomafiaId: 'test-tournament-multi',
        name: 'Test Tournament Multi',
        stars: 3,
        averageElo: 1500,
        isFsmRated: true,
        startDate: new Date('2024-01-01'),
        status: 'COMPLETED',
        createdBy: 'test-user',
      },
    });

    // Create games
    const game1 = await db.game.create({
      data: {
        id: 'test-game-multi-1',
        gomafiaId: 'game-multi-1',
        tournamentId: tournament.id,
        date: new Date('2024-01-02'),
        durationMinutes: 45,
        winnerTeam: 'MAFIA',
        status: 'COMPLETED',
      },
    });

    const game2 = await db.game.create({
      data: {
        id: 'test-game-multi-2',
        gomafiaId: 'game-multi-2',
        tournamentId: tournament.id,
        date: new Date('2024-01-03'),
        durationMinutes: 50,
        winnerTeam: 'CITIZENS',
        status: 'COMPLETED',
      },
    });

    // Player played as DON in game1, SHERIFF in game2
    await db.gameParticipation.createMany({
      data: [
        {
          id: 'participation-multi-1',
          playerId: player.id,
          gameId: game1.id,
          role: 'DON' as PlayerRole,
          team: 'MAFIA',
          isWinner: true,
          performanceScore: 8.0,
        },
        {
          id: 'participation-multi-2',
          playerId: player.id,
          gameId: game2.id,
          role: 'SHERIFF' as PlayerRole,
          team: 'CITIZENS',
          isWinner: true,
          performanceScore: 9.0,
        },
      ],
    });

    const phase = new StatisticsPhase(orchestrator);
    await phase.execute();

    // Verify stats for both roles
    const donStats = await db.playerRoleStats.findUnique({
      where: {
        playerId_role: {
          playerId: player.id,
          role: 'DON' as PlayerRole,
        },
      },
    });

    const sheriffStats = await db.playerRoleStats.findUnique({
      where: {
        playerId_role: {
          playerId: player.id,
          role: 'SHERIFF' as PlayerRole,
        },
      },
    });

    expect(donStats?.gamesPlayed).toBe(1);
    expect(donStats?.wins).toBe(1);
    expect(sheriffStats?.gamesPlayed).toBe(1);
    expect(sheriffStats?.wins).toBe(1);
  });
});
