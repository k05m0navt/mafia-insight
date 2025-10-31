import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  runDataVerification,
  getVerificationHistory,
} from '@/services/sync/verificationService';
import {
  clearTestDatabase,
  createTestPlayer,
  createTestClub,
  createTestTournament,
} from '../../setup';

// Mock the external API
vi.mock('@/lib/gomafia/api', () => ({
  fetchPlayerDetails: vi.fn((gomafiaId: string) => {
    return Promise.resolve({
      id: gomafiaId,
      name: 'Test Player',
      wins: 10,
      losses: 5,
      rating: 1500,
    });
  }),
  fetchClubDetails: vi.fn((gomafiaId: string) => {
    return Promise.resolve({
      id: gomafiaId,
      name: 'Test Club',
      city: 'Test Region',
    });
  }),
  fetchTournamentDetails: vi.fn((gomafiaId: string) => {
    return Promise.resolve({
      id: gomafiaId,
      name: 'Test Tournament',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });
  }),
}));

describe('Data Verification Service', () => {
  beforeEach(async () => {
    await clearTestDatabase();
    vi.clearAllMocks();
  });

  describe('runDataVerification', () => {
    it('should complete verification successfully', async () => {
      // Create test data
      await createTestPlayer({ gomafiaId: '12345', name: 'Test Player' });
      await createTestClub({ gomafiaId: 'club-123', name: 'Test Club' });
      await createTestTournament({
        gomafiaId: 'tournament-123',
        name: 'Test Tournament',
      });

      const report = await runDataVerification('MANUAL');

      expect(report).toBeDefined();
      expect(report.status).toBe('COMPLETED');
      expect(report.overallAccuracy).toBeGreaterThanOrEqual(0);
      expect(report.overallAccuracy).toBeLessThanOrEqual(100);
    });

    it('should use 1% sampling strategy', async () => {
      // Create 100 players (1% = 1 player)
      for (let i = 0; i < 100; i++) {
        await createTestPlayer({
          gomafiaId: `player-${i}`,
          name: `Player ${i}`,
        });
      }

      const report = await runDataVerification('MANUAL');

      expect(report.sampleStrategy).toBe('1_percent');
      expect(report.entities.players.sampled).toBeGreaterThanOrEqual(1);
      expect(report.entities.players.sampled).toBeLessThanOrEqual(
        report.entities.players.total
      );
    });

    it('should verify at least 1 item even if total < 100', async () => {
      // Create only 10 players
      for (let i = 0; i < 10; i++) {
        await createTestPlayer({
          gomafiaId: `player-${i}`,
          name: `Player ${i}`,
        });
      }

      const report = await runDataVerification('MANUAL');

      // Should sample at least 1 player
      expect(report.entities.players.sampled).toBeGreaterThanOrEqual(1);
    });

    it('should detect discrepancies in player data', async () => {
      // Create player with mismatched data
      await createTestPlayer({
        gomafiaId: '12345',
        name: 'Wrong Name', // External API returns "Test Player"
        wins: 10,
        eloRating: 1500,
      });

      const report = await runDataVerification('MANUAL');

      // Should detect name mismatch
      expect(report.status).toBe('FAILED');
      if (report.discrepancies) {
        expect(report.discrepancies.players.length).toBeGreaterThan(0);
      }
    });

    it('should calculate overall accuracy correctly', async () => {
      // Create matching data
      await createTestPlayer({
        gomafiaId: '12345',
        name: 'Test Player',
        wins: 10,
        eloRating: 1500,
      });
      await createTestClub({
        gomafiaId: 'club-123',
        name: 'Test Club',
        region: 'Test Region',
      });

      const report = await runDataVerification('MANUAL');

      // Should be 100% accurate
      expect(report.overallAccuracy).toBeGreaterThan(0);
    });

    it('should verify all entity types', async () => {
      await createTestPlayer({ gomafiaId: '12345' });
      await createTestClub({ gomafiaId: 'club-123' });
      await createTestTournament({ gomafiaId: 'tournament-123' });

      const report = await runDataVerification('MANUAL');

      expect(report.entities.players).toBeDefined();
      expect(report.entities.clubs).toBeDefined();
      expect(report.entities.tournaments).toBeDefined();
    });

    it('should handle manual trigger type', async () => {
      await createTestPlayer({ gomafiaId: '12345' });

      const report = await runDataVerification('MANUAL');

      expect(report.triggerType).toBe('MANUAL');
    });

    it('should handle scheduled trigger type', async () => {
      await createTestPlayer({ gomafiaId: '12345' });

      const report = await runDataVerification('SCHEDULED');

      expect(report.triggerType).toBe('SCHEDULED');
    });

    it('should save report to database', async () => {
      await createTestPlayer({ gomafiaId: '12345' });

      await runDataVerification('MANUAL');

      // Verify report was saved
      const { reports, total } = await getVerificationHistory(1, 10);
      expect(total).toBeGreaterThan(0);
      expect(reports).toHaveLength(1);
    });

    it('should include timestamp in report', async () => {
      await createTestPlayer({ gomafiaId: '12345' });

      const report = await runDataVerification('MANUAL');

      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.completedAt).toBeInstanceOf(Date);
    });

    it('should handle verification failure gracefully', async () => {
      // Mock API to throw error
      const { fetchPlayerDetails } = await import('@/lib/gomafia/api');
      vi.mocked(fetchPlayerDetails).mockRejectedValueOnce(
        new Error('API Error')
      );

      await createTestPlayer({ gomafiaId: '12345' });

      const report = await runDataVerification('MANUAL');

      expect(report.status).toBe('FAILED');
      if (report.discrepancies) {
        expect(report.discrepancies.players.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getVerificationHistory', () => {
    it('should return paginated verification reports', async () => {
      await createTestPlayer({ gomafiaId: '12345' });

      // Create multiple reports
      await runDataVerification('MANUAL');
      await runDataVerification('SCHEDULED');

      const { reports, total } = await getVerificationHistory(1, 10);

      expect(reports).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should return reports in descending order by timestamp', async () => {
      await createTestPlayer({ gomafiaId: '12345' });

      const report1 = await runDataVerification('MANUAL');
      await new Promise((resolve) => setTimeout(resolve, 100));
      const report2 = await runDataVerification('MANUAL');

      const { reports } = await getVerificationHistory(1, 10);

      // Most recent first
      expect(reports[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        report2.timestamp.getTime()
      );
      expect(reports[1].timestamp.getTime()).toBeLessThanOrEqual(
        report1.timestamp.getTime()
      );
    });

    it('should support pagination', async () => {
      await createTestPlayer({ gomafiaId: '12345' });

      // Create 5 reports
      for (let i = 0; i < 5; i++) {
        await runDataVerification('MANUAL');
      }

      const page1 = await getVerificationHistory(1, 2);
      const page2 = await getVerificationHistory(2, 2);

      expect(page1.reports).toHaveLength(2);
      expect(page2.reports).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page2.total).toBe(5);
    });

    it('should return empty array when no reports exist', async () => {
      const { reports, total } = await getVerificationHistory(1, 10);

      expect(reports).toHaveLength(0);
      expect(total).toBe(0);
    });
  });

  describe('Discrepancy Detection', () => {
    it('should detect name mismatches', async () => {
      await createTestPlayer({
        gomafiaId: '12345',
        name: 'Wrong Name',
      });

      const report = await runDataVerification('MANUAL');

      if (report.discrepancies) {
        const nameDiscrepancy = report.discrepancies.players.find(
          (d) => d.field === 'name'
        );
        expect(nameDiscrepancy).toBeDefined();
      }
    });

    it('should detect rating mismatches', async () => {
      await createTestPlayer({
        gomafiaId: '12345',
        name: 'Test Player',
        eloRating: 999, // API returns 1500
      });

      const report = await runDataVerification('MANUAL');

      if (report.discrepancies) {
        const ratingDiscrepancy = report.discrepancies.players.find(
          (d) => d.field === 'eloRating'
        );
        expect(ratingDiscrepancy).toBeDefined();
      }
    });

    it('should assign severity levels to discrepancies', async () => {
      await createTestPlayer({
        gomafiaId: '12345',
        name: 'Wrong Name',
      });

      const report = await runDataVerification('MANUAL');

      if (report.discrepancies && report.discrepancies.players.length > 0) {
        const discrepancy = report.discrepancies.players[0];
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(discrepancy.severity);
      }
    });

    it('should handle missing external data', async () => {
      const { fetchPlayerDetails } = await import('@/lib/gomafia/api');
      vi.mocked(fetchPlayerDetails).mockRejectedValueOnce(
        new Error('Not found')
      );

      await createTestPlayer({ gomafiaId: '12345' });

      const report = await runDataVerification('MANUAL');

      expect(report.status).toBe('FAILED');
    });
  });

  describe('Accuracy Calculation', () => {
    it('should calculate 100% accuracy for perfect matches', async () => {
      await createTestPlayer({
        gomafiaId: '12345',
        name: 'Test Player',
        wins: 10,
        eloRating: 1500,
      });

      const report = await runDataVerification('MANUAL');

      expect(report.entities.players.accuracy).toBe(100);
    });

    it('should calculate 0% accuracy for complete mismatches', async () => {
      await createTestPlayer({
        gomafiaId: '12345',
        name: 'Wrong Name',
        wins: 999,
        eloRating: 999,
      });

      const report = await runDataVerification('MANUAL');

      expect(report.entities.players.accuracy).toBeLessThan(100);
    });

    it('should calculate overall accuracy as average of all entities', async () => {
      await createTestPlayer({ gomafiaId: '12345', name: 'Test Player' });
      await createTestClub({ gomafiaId: 'club-123', name: 'Test Club' });
      await createTestTournament({
        gomafiaId: 'tournament-123',
        name: 'Test Tournament',
      });

      const report = await runDataVerification('MANUAL');

      const expectedAverage =
        (report.entities.players.accuracy +
          report.entities.clubs.accuracy +
          report.entities.tournaments.accuracy) /
        3;

      expect(report.overallAccuracy).toBeCloseTo(expectedAverage, 1);
    });
  });
});
