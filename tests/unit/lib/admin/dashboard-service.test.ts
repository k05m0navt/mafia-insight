import { describe, it, expect, beforeEach } from 'vitest';
import { getDashboardMetrics } from '@/lib/admin/dashboard-service';
import { prisma } from '@/lib/db';

describe('Dashboard Service', () => {
  beforeEach(async () => {
    // Clear all data
    await prisma.notification.deleteMany({});
    await prisma.emailLog.deleteMany({});
    await prisma.dataIntegrityReport.deleteMany({});
    await prisma.gameParticipation.deleteMany({});
    await prisma.playerYearStats.deleteMany({});
    await prisma.playerRoleStats.deleteMany({});
    await prisma.playerTournament.deleteMany({});
    await prisma.game.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.player.deleteMany({});
    await prisma.club.deleteMany({});
    await prisma.syncLog.deleteMany({});
    await prisma.syncStatus.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('getDashboardMetrics', () => {
    it('should return correct data volume counts', async () => {
      // Create test data
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          subscriptionTier: 'FREE',
          role: 'user',
        },
      });

      await prisma.player.create({
        data: {
          gomafiaId: 'player1',
          name: 'Player 1',
          userId: user.id,
          eloRating: 1200,
          totalGames: 0,
          wins: 0,
          losses: 0,
        },
      });

      await prisma.player.create({
        data: {
          gomafiaId: 'player2',
          name: 'Player 2',
          userId: user.id,
          eloRating: 1200,
          totalGames: 0,
          wins: 0,
          losses: 0,
        },
      });

      await prisma.club.create({
        data: {
          gomafiaId: 'club1',
          name: 'Club 1',
          region: 'Test',
          createdBy: user.id,
        },
      });

      const metrics = await getDashboardMetrics();

      expect(metrics.dataVolumes.totalPlayers).toBe(2);
      expect(metrics.dataVolumes.totalClubs).toBe(1);
      expect(metrics.dataVolumes.totalGames).toBe(0);
      expect(metrics.dataVolumes.totalTournaments).toBe(0);
    });

    it('should return import status when no sync exists', async () => {
      const metrics = await getDashboardMetrics();

      expect(metrics.importStatus.isRunning).toBe(false);
      expect(metrics.importStatus.progress).toBeNull();
      expect(metrics.importStatus.lastSyncTime).toBeNull();
    });

    it('should return system health status', async () => {
      const metrics = await getDashboardMetrics();

      expect(metrics.systemHealth.status).toBeDefined();
      expect(metrics.systemHealth.databaseConnected).toBe(true);
      expect(metrics.systemHealth.errorsLast24h).toBeDefined();
    });

    it('should return recent activity', async () => {
      const metrics = await getDashboardMetrics();

      expect(metrics.recentActivity).toBeDefined();
      expect(metrics.recentActivity.imports).toBeInstanceOf(Array);
    });
  });
});
