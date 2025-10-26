import { ImportOrchestrator } from '../import-orchestrator';
import { ImportCheckpoint } from '../checkpoint-manager';
import { resilientDB } from '@/lib/db-resilient';

/**
 * Phase 5: Import player-tournament participation history
 *
 * For each player, imports their tournament history including:
 * - Placement/rank
 * - GG Points earned
 * - ELO change
 * - Prize money won
 *
 * Note: This requires a scraper for /stats/{id}?tab=history which is not yet implemented.
 * This is a placeholder implementation.
 */
export class PlayerTournamentPhase {
  constructor(private orchestrator: ImportOrchestrator) {}

  /**
   * Get phase name.
   */
  getPhaseName(): 'PLAYER_TOURNAMENT_HISTORY' {
    return 'PLAYER_TOURNAMENT_HISTORY';
  }

  /**
   * Execute the player-tournament history import phase.
   */
  async execute(): Promise<void> {
    console.log(
      '[PlayerTournamentPhase] Starting player-tournament history import...'
    );

    // Get all players
    const players = await resilientDB.execute((db) =>
      db.player.findMany({
        select: { id: true, gomafiaId: true, name: true },
      })
    );

    console.log(
      `[PlayerTournamentPhase] Found ${players.length} players to process`
    );

    let totalLinks = 0;
    let errorCount = 0;

    // Process players in batches
    const batchProcessor = this.orchestrator.getBatchProcessor();

    await batchProcessor.process(
      players,
      async (batch, batchIndex, totalBatches) => {
        const linksToInsert: Array<{
          playerId: string;
          tournamentId: string;
          placement: number | null;
          ggPointsEarned: number | null;
          eloChange: number | null;
          prizeMoney: number | null;
        }> = [];

        for (const player of batch) {
          try {
            // TODO: Implement scraper for /stats/{id}?tab=history
            // For now, we'll create links based on games the player participated in

            // Get all games for this player
            const games = await this.orchestrator[
              'db'
            ].gameParticipation.findMany({
              where: { playerId: player.id },
              include: { game: true },
              distinct: ['gameId'],
            });

            // Group by tournament
            const tournamentMap = new Map<string, any[]>();
            for (const participation of games) {
              if (participation.game.tournamentId) {
                if (!tournamentMap.has(participation.game.tournamentId)) {
                  tournamentMap.set(participation.game.tournamentId, []);
                }
                tournamentMap
                  .get(participation.game.tournamentId)!
                  .push(participation);
              }
            }

            // Create PlayerTournament records
            for (const [
              tournamentId,
              participations,
            ] of tournamentMap.entries()) {
              // Calculate aggregate stats for this tournament
              const _wins = participations.filter((p) => p.isWinner).length;
              const _totalGames = participations.length;

              linksToInsert.push({
                playerId: player.id,
                tournamentId: tournamentId,
                placement: null, // Would come from scraper
                ggPointsEarned: null, // Would come from scraper
                eloChange: null, // Would come from scraper
                prizeMoney: null, // Would come from scraper
              });
            }

            totalLinks += tournamentMap.size;
          } catch (error) {
            console.error(
              `[PlayerTournamentPhase] Failed to process player ${player.name}:`,
              error
            );
            errorCount++;
          }
        }

        // Bulk insert links
        if (linksToInsert.length > 0) {
          await resilientDB.execute((db) =>
            db.playerTournament.createMany({
              data: linksToInsert,
              skipDuplicates: true,
            })
          );
        }

        // Save checkpoint
        const checkpoint = this.createCheckpoint(
          batchIndex,
          totalBatches,
          batch.map((p) => p.gomafiaId)
        );
        await this.orchestrator.saveCheckpoint(checkpoint);

        console.log(
          `[PlayerTournamentPhase] Processed batch ${batchIndex + 1}/${totalBatches} (${totalLinks} links, ${errorCount} errors)`
        );
      }
    );

    console.log(
      `[PlayerTournamentPhase] Player-tournament history import complete (${totalLinks} links, ${errorCount} errors)`
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
      currentPhase: 'PLAYER_TOURNAMENT_HISTORY',
      currentBatch: batchIndex,
      lastProcessedId:
        processedIds.length > 0 ? processedIds[processedIds.length - 1] : null,
      processedIds,
      progress: Math.floor(((batchIndex + 1) / totalBatches) * 100),
    };
  }
}
