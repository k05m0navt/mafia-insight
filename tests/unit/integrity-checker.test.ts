import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { IntegrityChecker } from '@/lib/gomafia/import/integrity-checker';

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    gameParticipation: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    player: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    tournament: {
      findMany: vi.fn(),
    },
    game: {
      findMany: vi.fn(),
    },
    playerTournament: {
      findMany: vi.fn(),
    },
  })),
}));

describe('IntegrityChecker', () => {
  let checker: IntegrityChecker;
  let mockDb: any;

  beforeEach(() => {
    mockDb = new PrismaClient();
    checker = new IntegrityChecker(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkGameParticipationLinks', () => {
    it('should pass when all participations link to valid players', async () => {
      mockDb.gameParticipation.findMany.mockResolvedValue([
        { id: '1', playerId: 'player-1', gameId: 'game-1' },
        { id: '2', playerId: 'player-2', gameId: 'game-1' },
      ]);
      mockDb.player.findMany.mockResolvedValue([
        { id: 'player-1' },
        { id: 'player-2' },
      ]);

      const result = await checker.checkGameParticipationLinks();

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.totalChecked).toBe(2);
    });

    it('should fail when participations link to non-existent players', async () => {
      mockDb.gameParticipation.findMany.mockResolvedValue([
        { id: '1', playerId: 'player-1', gameId: 'game-1' },
        { id: '2', playerId: 'player-999', gameId: 'game-1' },
      ]);
      mockDb.player.findMany.mockResolvedValue([{ id: 'player-1' }]);

      const result = await checker.checkGameParticipationLinks();

      expect(result.passed).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('player-999');
    });
  });

  describe('checkPlayerTournamentLinks', () => {
    it('should pass when all player tournaments link correctly', async () => {
      mockDb.playerTournament.findMany.mockResolvedValue([
        { id: '1', playerId: 'player-1', tournamentId: 'tournament-1' },
      ]);
      mockDb.player.findMany.mockResolvedValue([{ id: 'player-1' }]);
      mockDb.tournament.findMany.mockResolvedValue([{ id: 'tournament-1' }]);

      const result = await checker.checkPlayerTournamentLinks();

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when player tournament links to non-existent tournament', async () => {
      mockDb.playerTournament.findMany.mockResolvedValue([
        { id: '1', playerId: 'player-1', tournamentId: 'tournament-999' },
      ]);
      mockDb.player.findMany.mockResolvedValue([{ id: 'player-1' }]);
      mockDb.tournament.findMany.mockResolvedValue([]);

      const result = await checker.checkPlayerTournamentLinks();

      expect(result.passed).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('tournament-999');
    });
  });

  describe('checkOrphanedRecords', () => {
    it('should detect games without tournaments', async () => {
      mockDb.tournament.findMany.mockResolvedValue([]);
      mockDb.game.findMany.mockResolvedValue([
        { id: 'game-1', tournamentId: 'tournament-999' },
      ]);
      mockDb.player.findMany.mockResolvedValue([]);
      mockDb.gameParticipation.findMany.mockResolvedValue([]);
      mockDb.playerTournament.findMany.mockResolvedValue([]);

      const result = await checker.checkOrphanedRecords();

      expect(result.orphanedGames).toBeGreaterThan(0);
      expect(result.passed).toBe(false);
    });

    it('should pass when no orphaned records exist', async () => {
      mockDb.tournament.findMany.mockResolvedValue([]);
      mockDb.game.findMany.mockResolvedValue([]);
      mockDb.player.findMany.mockResolvedValue([]);
      mockDb.gameParticipation.findMany.mockResolvedValue([]);
      mockDb.playerTournament.findMany.mockResolvedValue([]);

      const result = await checker.checkOrphanedRecords();

      expect(result.passed).toBe(true);
      expect(result.orphanedGames).toBe(0);
    });
  });

  describe('checkAllIntegrity', () => {
    it('should run all integrity checks and aggregate results', async () => {
      // Mock all checks to pass
      mockDb.gameParticipation.findMany.mockResolvedValue([]);
      mockDb.playerTournament.findMany.mockResolvedValue([]);
      mockDb.game.findMany.mockResolvedValue([]);
      mockDb.player.findMany.mockResolvedValue([]);
      mockDb.tournament.findMany.mockResolvedValue([]);

      const result = await checker.checkAllIntegrity();

      expect(result.passed).toBe(true);
      expect(result.checks).toHaveLength(3);
      expect(result.summary).toBeDefined();
    });

    it('should indicate failure if any check fails', async () => {
      mockDb.gameParticipation.findMany.mockResolvedValue([
        { id: '1', playerId: 'invalid', gameId: 'game-1' },
      ]);
      mockDb.player.findMany.mockResolvedValue([]);
      mockDb.playerTournament.findMany.mockResolvedValue([]);
      mockDb.game.findMany.mockResolvedValue([]);
      mockDb.tournament.findMany.mockResolvedValue([]);

      const result = await checker.checkAllIntegrity();

      expect(result.passed).toBe(false);
      expect(result.failedChecks).toBeGreaterThan(0);
    });
  });

  describe('getIntegritySummary', () => {
    it('should provide readable summary of integrity status', async () => {
      mockDb.gameParticipation.findMany.mockResolvedValue([]);
      mockDb.playerTournament.findMany.mockResolvedValue([]);
      mockDb.game.findMany.mockResolvedValue([]);
      mockDb.player.findMany.mockResolvedValue([]);
      mockDb.tournament.findMany.mockResolvedValue([]);

      const summary = await checker.getIntegritySummary();

      expect(summary.status).toBe('PASS');
      expect(summary.totalChecks).toBeGreaterThan(0);
      expect(summary.passedChecks).toBe(summary.totalChecks);
      expect(summary.message).toContain('integrity checks passed');
    });

    it('should indicate warnings when integrity issues found', async () => {
      mockDb.gameParticipation.findMany.mockResolvedValue([
        { id: '1', playerId: 'invalid', gameId: 'game-1' },
      ]);
      mockDb.player.findMany.mockResolvedValue([]);
      mockDb.playerTournament.findMany.mockResolvedValue([]);
      mockDb.game.findMany.mockResolvedValue([]);
      mockDb.tournament.findMany.mockResolvedValue([]);

      const summary = await checker.getIntegritySummary();

      expect(summary.status).toBe('FAIL');
      expect(summary.failedChecks).toBeGreaterThan(0);
      expect(summary.issues).toBeDefined();
    });
  });
});
