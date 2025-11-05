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

/**
 * Data types that can be deleted selectively
 */
export type DeletableDataType =
  | 'tournaments'
  | 'players'
  | 'clubs'
  | 'games'
  | 'player_statistics'
  | 'tournament_results'
  | 'judges'
  | 'all';

/**
 * Clear specific type of data from the database
 *
 * @param dataType - The type of data to delete
 * @param adminId - ID of the admin performing the operation
 * @returns Count of deleted records
 */
export async function clearDataType(
  dataType: DeletableDataType,
  adminId: string
): Promise<{
  deleted: Record<string, number>;
  dataType: DeletableDataType;
}> {
  // Verify no active import
  const status = await db.syncStatus.findUnique({ where: { id: 'current' } });
  if (status?.isRunning) {
    throw new Error('Cannot clear database while import is running');
  }

  // Check ImportProgress for running imports
  const runningImport = await db.importProgress.findFirst({
    where: { status: 'RUNNING' },
  });
  if (runningImport) {
    throw new Error('Cannot clear database while import is running');
  }

  // Execute clear in transaction
  const deleted = await resilientDB.execute(async (tx) => {
    const deletedCounts: Record<string, number> = {};

    if (dataType === 'all') {
      // Use existing clearDatabase logic
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
      deletedCounts.game = (await tx.game.deleteMany({})).count;
      deletedCounts.tournament = (await tx.tournament.deleteMany({})).count;
      deletedCounts.player = (await tx.player.deleteMany({})).count;
      deletedCounts.club = (await tx.club.deleteMany({})).count;
      deletedCounts.analytics = (await tx.analytics.deleteMany({})).count;
      // Note: gameCount is deleted with tournaments, so no need to reset
    } else if (dataType === 'tournaments') {
      // Delete tournaments and related data
      deletedCounts.playerTournament = (
        await tx.playerTournament.deleteMany({})
      ).count;
      deletedCounts.game = (await tx.game.deleteMany({})).count; // Games depend on tournaments
      deletedCounts.tournament = (await tx.tournament.deleteMany({})).count;
      // Note: gameCount is deleted with tournaments, so no need to reset
    } else if (dataType === 'players') {
      // Delete players and related data
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
      deletedCounts.player = (await tx.player.deleteMany({})).count;
    } else if (dataType === 'clubs') {
      // Delete clubs (players must be deleted first or unlinked)
      // First, unlink players from clubs
      await tx.player.updateMany({
        where: { clubId: { not: null } },
        data: { clubId: null },
      });
      deletedCounts.club = (await tx.club.deleteMany({})).count;
    } else if (dataType === 'games') {
      // Delete games and related data
      deletedCounts.gameParticipation = (
        await tx.gameParticipation.deleteMany({})
      ).count;
      deletedCounts.game = (await tx.game.deleteMany({})).count;

      // Reset tournament gameCount to 0 since all games are deleted
      await tx.tournament.updateMany({
        data: {
          gameCount: 0,
        },
      });
    } else if (dataType === 'player_statistics') {
      // Delete only player statistics (year stats and role stats)
      // Players are kept intact
      deletedCounts.playerYearStats = (
        await tx.playerYearStats.deleteMany({})
      ).count;
      deletedCounts.playerRoleStats = (
        await tx.playerRoleStats.deleteMany({})
      ).count;
    } else if (dataType === 'tournament_results') {
      // Delete only player-tournament relationships (tournament results)
      // Players and tournaments are kept intact
      deletedCounts.playerTournament = (
        await tx.playerTournament.deleteMany({})
      ).count;
    } else if (dataType === 'judges') {
      // Clear all judge information from players
      // Players are kept intact, only judge fields are nulled
      const playersUpdated = await tx.player.updateMany({
        where: {
          OR: [
            { judgeCategory: { not: null } },
            { judgeCanBeGs: { not: null } },
            { judgeCanJudgeFinal: true },
            { judgeMaxTablesAsGs: { not: null } },
            { judgeRating: { not: null } },
            { judgeGamesJudged: { not: null } },
            { judgeAccreditationDate: { not: null } },
            { judgeResponsibleFromSc: { not: null } },
          ],
        },
        data: {
          judgeCategory: null,
          judgeCanBeGs: null,
          judgeCanJudgeFinal: false,
          judgeMaxTablesAsGs: null,
          judgeRating: null,
          judgeGamesJudged: null,
          judgeAccreditationDate: null,
          judgeResponsibleFromSc: null,
        },
      });
      deletedCounts.players_judge_fields_cleared = playersUpdated.count;
    }

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
          operation: 'SELECTIVE_DATA_CLEAR',
          dataType,
          adminId,
          deleted: deleted,
        } as Prisma.InputJsonValue,
      },
    })
  );

  console.log(`Data type "${dataType}" cleared by admin: ${adminId}`, deleted);

  return { deleted, dataType };
}
