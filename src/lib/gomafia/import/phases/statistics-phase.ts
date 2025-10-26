import { ImportOrchestrator } from '../import-orchestrator';
import { ImportCheckpoint } from '../checkpoint-manager';
import { resilientDB } from '@/lib/db-resilient';
import { PlayerRole } from '@prisma/client';

/**
 * Phase 7: Calculate aggregate statistics
 *
 * Calculates PlayerRoleStats based on imported games and participations.
 * This phase runs after all data is imported.
 */
export class StatisticsPhase {
  constructor(private orchestrator: ImportOrchestrator) {}

  /**
   * Get phase name.
   */
  getPhaseName(): 'STATISTICS' {
    return 'STATISTICS';
  }

  /**
   * Execute the statistics calculation phase.
   */
  async execute(): Promise<void> {
    console.log('[StatisticsPhase] Starting statistics calculation...');

    // Get all players
    const players = await resilientDB.execute((db) =>
      db.player.findMany({
        select: { id: true, name: true },
      })
    );

    console.log(
      `[StatisticsPhase] Calculating stats for ${players.length} players`
    );

    let statsCreated = 0;

    // Process players in batches
    const batchProcessor = this.orchestrator.getBatchProcessor();

    await batchProcessor.process(
      players,
      async (batch, batchIndex, totalBatches) => {
        for (const player of batch) {
          // Calculate stats for each role
          const roles: PlayerRole[] = ['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'];

          for (const role of roles) {
            // Get all participations for this player and role
            const participations = await this.orchestrator[
              'db'
            ].gameParticipation.findMany({
              where: {
                playerId: player.id,
                role: role,
              },
              include: {
                game: true,
              },
            });

            if (participations.length === 0) continue;

            // Calculate statistics
            const gamesPlayed = participations.length;
            const wins = participations.filter((p) => p.isWinner).length;
            const losses = gamesPlayed - wins;
            const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
            const averagePerformance =
              participations.reduce(
                (sum, p) => sum + (p.performanceScore || 0),
                0
              ) / gamesPlayed;
            const lastPlayed =
              participations.length > 0
                ? participations.reduce(
                    (latest, p) =>
                      p.game.date > latest ? p.game.date : latest,
                    participations[0].game.date
                  )
                : null;

            // Upsert PlayerRoleStats
            await resilientDB.execute((db) =>
              db.playerRoleStats.upsert({
                where: {
                  playerId_role: {
                    playerId: player.id,
                    role: role,
                  },
                },
                update: {
                  gamesPlayed,
                  wins,
                  losses,
                  winRate,
                  averagePerformance,
                  lastPlayed,
                },
                create: {
                  playerId: player.id,
                  role,
                  gamesPlayed,
                  wins,
                  losses,
                  winRate,
                  averagePerformance,
                  lastPlayed,
                },
              })
            );

            statsCreated++;
          }
        }

        // Save checkpoint
        const checkpoint = this.createCheckpoint(
          batchIndex,
          totalBatches,
          batch.map((p) => p.id)
        );
        await this.orchestrator.saveCheckpoint(checkpoint);

        console.log(
          `[StatisticsPhase] Calculated stats for batch ${batchIndex + 1}/${totalBatches} (${statsCreated} stats created)`
        );
      }
    );

    console.log(
      `[StatisticsPhase] Statistics calculation complete (${statsCreated} stats created)`
    );
  }

  /**
   * Create checkpoint for this phase.
   */
  createCheckpoint(
    batchIndex: number,
    totalBatches: number,
    processedIds: string[]
  ): ImportCheckpoint {
    return {
      currentPhase: 'STATISTICS',
      currentBatch: batchIndex,
      lastProcessedId:
        processedIds.length > 0 ? processedIds[processedIds.length - 1] : null,
      processedIds,
      progress: Math.floor(((batchIndex + 1) / totalBatches) * 100),
    };
  }
}
