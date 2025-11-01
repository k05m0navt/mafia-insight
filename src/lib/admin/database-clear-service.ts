import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { resilientDB } from '@/lib/db-resilient';

/**
 * Clear all imported game data while preserving system data
 *
 * Tables deleted (in dependency order):
 * - GameParticipation, PlayerYearStats, PlayerRoleStats, PlayerTournament
 * - Game, Tournament
 * - Player, Club
 * - Analytics
 *
 * Tables preserved:
 * - User, SyncLog, SyncStatus, ImportCheckpoint, ImportProgress
 * - Region, Notification, DataIntegrityReport, EmailLog
 */
export async function clearDatabase(adminId: string): Promise<{
  deleted: Record<string, number>;
}> {
  // Verify no active import
  const status = await db.syncStatus.findUnique({ where: { id: 'current' } });
  if (status?.isRunning) {
    throw new Error('Cannot clear database while import is running');
  }

  // Execute clear in transaction
  const deleted = await resilientDB.execute(async (tx) => {
    // Delete in dependency order to avoid foreign key violations
    const deletedCounts: Record<string, number> = {};

    // Delete participation and stats first (depend on Players/Games/Tournaments)
    deletedCounts.gameParticipation = (
      await tx.gameParticipation.deleteMany({})
    ).count;
    deletedCounts.playerYearStats = (
      await tx.playerYearStats.deleteMany({})
    ).count;
    deletedCounts.playerRoleStats = (
      await tx.playerRoleStats.deleteMany({})
    ).count;
    deletedCounts.playerTournament = (
      await tx.playerTournament.deleteMany({})
    ).count;

    // Delete games and tournaments
    deletedCounts.game = (await tx.game.deleteMany({})).count;
    deletedCounts.tournament = (await tx.tournament.deleteMany({})).count;

    // Delete players and clubs
    deletedCounts.player = (await tx.player.deleteMany({})).count;
    deletedCounts.club = (await tx.club.deleteMany({})).count;

    // Delete analytics
    deletedCounts.analytics = (await tx.analytics.deleteMany({})).count;

    return deletedCounts;
  });

  // Log the operation
  await resilientDB.execute((db) =>
    db.syncLog.create({
      data: {
        type: 'FULL',
        status: 'COMPLETED',
        startTime: new Date(),
        endTime: new Date(),
        recordsProcessed: 0,
        errors: {
          operation: 'DATABASE_CLEAR',
          adminId,
          deleted: deleted,
        } as Prisma.InputJsonValue,
      },
    })
  );

  console.log(`Database cleared by admin: ${adminId}`, deleted);

  return { deleted };
}
