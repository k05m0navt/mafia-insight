import { ImportOrchestrator } from '../import-orchestrator';
import { ImportCheckpoint } from '../checkpoint-manager';
import { resilientDB } from '@/lib/db-resilient';

/**
 * Phase 6: Import games and game participations
 *
 * For each tournament, imports all games with their participations.
 * Games are ordered newest-first (descending chronological).
 *
 * Note: This requires a scraper for /tournament/{id}?tab=games which is not yet implemented.
 * This is a placeholder implementation that creates sample data structure.
 */
export class GamesPhase {
  constructor(private orchestrator: ImportOrchestrator) {}

  /**
   * Get phase name.
   */
  getPhaseName(): 'GAMES' {
    return 'GAMES';
  }

  /**
   * Execute the games import phase.
   */
  async execute(): Promise<void> {
    console.log('[GamesPhase] Starting games import...');

    // Get all tournaments
    const tournaments = await resilientDB.execute((db) =>
      db.tournament.findMany({
        select: { id: true, gomafiaId: true, name: true },
      })
    );

    console.log(
      `[GamesPhase] Found ${tournaments.length} tournaments to process`
    );

    // eslint-disable-next-line prefer-const
    let totalGames = 0;
    // eslint-disable-next-line prefer-const
    let totalParticipations = 0;
    let errorCount = 0;

    // Process tournaments in batches
    const batchProcessor = this.orchestrator.getBatchProcessor();

    await batchProcessor.process(
      tournaments,
      async (batch, batchIndex, totalBatches) => {
        for (const tournament of batch) {
          try {
            // TODO: Implement scraper for /tournament/{id}?tab=games
            // For now, we'll log that this phase needs implementation
            console.log(
              `[GamesPhase] Would scrape games for tournament: ${tournament.name}`
            );

            // Placeholder: In real implementation, this would:
            // 1. Scrape all games from /tournament/{id}?tab=games
            // 2. For each game, extract:
            //    - Game metadata (date, duration, winner team, status)
            //    - All participations (players, roles, teams, outcomes)
            // 3. Validate with Zod schemas
            // 4. Insert games with participations in transactions

            // Example structure (commented out - needs real data):
            /*
          const games = await scrapeGamesForTournament(tournament.gomafiaId);
          
          for (const gameData of games) {
            // Insert game
            const game = await resilientDB.execute(
              (db) => db.game.create({
                data: {
                  gomafiaId: gameData.gomafiaId,
                  tournamentId: tournament.id,
                date: new Date(gameData.date),
                durationMinutes: gameData.durationMinutes,
                winnerTeam: gameData.winnerTeam,
                status: gameData.status,
                lastSyncAt: new Date(),
                syncStatus: 'SYNCED'
              }
            });
            
            // Insert participations
            const participations = gameData.participations.map(p => ({
              playerId: p.playerId, // Look up by gomafiaId
              gameId: game.id,
              role: p.role,
              team: p.team,
              isWinner: p.isWinner,
              performanceScore: p.performanceScore
            }));
            
            await resilientDB.execute(
              (db) => db.gameParticipation.createMany({
                data: participations
              })
            );
            
            totalGames++;
            totalParticipations += participations.length;
          }
          */
          } catch (error) {
            console.error(
              `[GamesPhase] Failed to process tournament ${tournament.name}:`,
              error
            );
            errorCount++;
          }
        }

        // Save checkpoint
        const checkpoint = this.createCheckpoint(
          batchIndex,
          totalBatches,
          batch.map((t) => t.gomafiaId)
        );
        await this.orchestrator.saveCheckpoint(checkpoint);

        console.log(
          `[GamesPhase] Processed batch ${batchIndex + 1}/${totalBatches}`
        );
      }
    );

    console.log(
      `[GamesPhase] Games import complete (${totalGames} games, ${totalParticipations} participations, ${errorCount} errors)`
    );
    console.log(
      '[GamesPhase] NOTE: This phase requires additional scraper implementation for /tournament/{id}?tab=games'
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
      currentPhase: 'GAMES',
      currentBatch: batchIndex,
      lastProcessedId:
        processedIds.length > 0 ? processedIds[processedIds.length - 1] : null,
      processedIds,
      progress: Math.floor(((batchIndex + 1) / totalBatches) * 100),
    };
  }
}
