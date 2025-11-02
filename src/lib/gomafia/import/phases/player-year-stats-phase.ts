import { ImportOrchestrator } from '../import-orchestrator';
import { ImportCheckpoint } from '../checkpoint-manager';
import { PlayerStatsScraper } from '../../scrapers/player-stats-scraper';
import { resilientDB } from '@/lib/db-resilient';

/**
 * Phase 3: Import player year-specific statistics
 *
 * For each player, scrapes year-by-year statistics from gomafia.pro/stats/{id}
 * Stops after 2 consecutive years with no data.
 */
export class PlayerYearStatsPhase {
  private playerStatsScraper: PlayerStatsScraper | null = null;

  constructor(private orchestrator: ImportOrchestrator) {}

  /**
   * Initialize scraper with browser page.
   */
  private async initializeScraper(): Promise<void> {
    if (this.playerStatsScraper) return;

    const browser = this.orchestrator.getBrowser();
    const page = await browser.newPage();
    this.playerStatsScraper = new PlayerStatsScraper(page);
  }

  /**
   * Get phase name.
   */
  getPhaseName(): 'PLAYER_YEAR_STATS' {
    return 'PLAYER_YEAR_STATS';
  }

  /**
   * Execute the player year stats import phase.
   */
  async execute(): Promise<void> {
    console.log('[PlayerYearStatsPhase] Starting player year stats import...');

    // Initialize scraper
    await this.initializeScraper();
    if (!this.playerStatsScraper) {
      throw new Error('Failed to initialize player stats scraper');
    }

    // Get all players
    const players = (await resilientDB.execute((db) =>
      db.player.findMany({
        select: { id: true, gomafiaId: true, name: true },
      })
    )) as Array<{ id: string; gomafiaId: string; name: string }>;

    console.log(
      `[PlayerYearStatsPhase] Found ${players.length} players to process`
    );

    // Reset and set total records for progress tracking
    // Clear any previous metrics and set the total number of players to process
    this.orchestrator.updateValidationMetrics({
      totalFetched: players.length,
      validRecords: 0, // Start with 0 processed
      invalidRecords: 0, // Reset error count
    });

    const startTime = Date.now();
    let totalStats = 0;
    let errorCount = 0;
    let processedPlayers = 0;
    let playersWithStats = 0;
    let playersWithoutStats = 0;

    // Process players in batches
    const batchProcessor = this.orchestrator.getBatchProcessor();

    await batchProcessor.process(
      players,
      async (batch, batchIndex, totalBatches) => {
        const batchStartTime = Date.now();

        for (const player of batch as Array<{
          id: string;
          name: string;
          gomafiaId: string;
        }>) {
          try {
            // Scrape year stats for this player
            const yearStats = await this.playerStatsScraper!.scrapeAllYears(
              player.gomafiaId
            );

            processedPlayers++;

            // Update progress metrics - track processed players in validRecords
            // (since we're tracking players, not individual stats here)
            // totalFetched = total players, validRecords = processed players
            this.orchestrator.updateValidationMetrics({
              validRecords: processedPlayers,
            });

            if (yearStats.length > 0) {
              playersWithStats++;

              // Transform to Prisma format
              const playerStatsToInsert = yearStats.map((stats) => ({
                playerId: player.id,
                year: stats.year,
                totalGames: stats.totalGames,
                donGames: stats.donGames,
                mafiaGames: stats.mafiaGames,
                sheriffGames: stats.sheriffGames,
                civilianGames: stats.civilianGames,
                eloRating: stats.eloRating,
                extraPoints: stats.extraPoints,
              }));

              // Save immediately to Supabase after scraping
              const insertStartTime = Date.now();
              try {
                await resilientDB.execute((db) =>
                  db.playerYearStats.createMany({
                    data: playerStatsToInsert,
                    skipDuplicates: true,
                  })
                );
                const insertDuration = Date.now() - insertStartTime;

                totalStats += yearStats.length;

                // Note: validRecords is already tracking processedPlayers above,
                // which is what we want for progress (players processed, not stats count)

                // Log every player with stats and save confirmation
                console.log(
                  `[PlayerYearStatsPhase] [${processedPlayers}/${players.length}] Player: ${player.name} (ID: ${player.gomafiaId}) | ` +
                    `Year stats: ${yearStats.length} | ` +
                    `Saved to Supabase in ${insertDuration}ms | ` +
                    `Total stats: ${totalStats} | ` +
                    `Errors: ${errorCount}`
                );
              } catch (insertError) {
                console.error(
                  `[PlayerYearStatsPhase] Failed to save stats for player ${player.name} (ID: ${player.gomafiaId}):`,
                  insertError instanceof Error
                    ? insertError.message
                    : insertError
                );
                // Still count the stats as scraped even if save failed
                totalStats += yearStats.length;
                errorCount++;

                // Update metrics with invalid records (player still processed, so validRecords stays the same)
                this.orchestrator.updateValidationMetrics({
                  invalidRecords: errorCount,
                });
              }
            } else {
              playersWithoutStats++;
              // Log every player without stats
              console.log(
                `[PlayerYearStatsPhase] [${processedPlayers}/${players.length}] Player: ${player.name} (ID: ${player.gomafiaId}) | ` +
                  `No stats found | ` +
                  `Players without stats: ${playersWithoutStats} | ` +
                  `Errors: ${errorCount}`
              );
            }
          } catch (error) {
            errorCount++;
            processedPlayers++;

            // Update progress metrics even on error
            // totalFetched stays as players.length (set at start)
            // validRecords = processedPlayers (tracks progress)
            this.orchestrator.updateValidationMetrics({
              validRecords: processedPlayers,
              invalidRecords: errorCount,
            });

            console.error(
              `[PlayerYearStatsPhase] Failed to scrape stats for player ${player.name} (ID: ${player.gomafiaId}):`,
              error instanceof Error ? error.message : error
            );
          }
        }

        // Save checkpoint
        const checkpoint = this.createCheckpoint(
          batchIndex,
          totalBatches,
          (batch as Array<{ gomafiaId: string }>).map(
            (p: { gomafiaId: string }) => p.gomafiaId
          )
        );
        await this.orchestrator.saveCheckpoint(checkpoint);

        const batchDuration = Date.now() - batchStartTime;
        const elapsed = Date.now() - startTime;
        const avgTimePerBatch = elapsed / (batchIndex + 1);
        const remainingBatches = totalBatches - (batchIndex + 1);
        const estimatedRemaining = Math.round(
          (remainingBatches * avgTimePerBatch) / 1000
        );

        console.log(
          `[PlayerYearStatsPhase] Batch ${batchIndex + 1}/${totalBatches} complete in ${Math.round(batchDuration / 1000)}s | ` +
            `Processed: ${processedPlayers}/${players.length} players | ` +
            `Stats imported: ${totalStats} | ` +
            `Players with stats: ${playersWithStats} | ` +
            `Players without stats: ${playersWithoutStats} | ` +
            `Errors: ${errorCount} | ` +
            `Estimated remaining: ~${estimatedRemaining}s`
        );
      }
    );

    const totalDuration = Date.now() - startTime;
    const avgTimePerPlayer = totalDuration / players.length;

    console.log(`[PlayerYearStatsPhase] ===== Import Complete =====`);
    console.log(
      `[PlayerYearStatsPhase] Total players processed: ${processedPlayers}/${players.length}`
    );
    console.log(
      `[PlayerYearStatsPhase] Players with stats: ${playersWithStats} (${Math.round((playersWithStats / processedPlayers) * 100)}%)`
    );
    console.log(
      `[PlayerYearStatsPhase] Players without stats: ${playersWithoutStats}`
    );
    console.log(
      `[PlayerYearStatsPhase] Total year stats imported: ${totalStats}`
    );
    console.log(`[PlayerYearStatsPhase] Errors encountered: ${errorCount}`);
    console.log(
      `[PlayerYearStatsPhase] Total duration: ${Math.round(totalDuration / 1000)}s (${Math.round(totalDuration / 60000)}m ${Math.round((totalDuration % 60000) / 1000)}s)`
    );
    console.log(
      `[PlayerYearStatsPhase] Average time per player: ${Math.round(avgTimePerPlayer)}ms`
    );
    console.log(
      `[PlayerYearStatsPhase] Average stats per player: ${totalStats > 0 ? (totalStats / playersWithStats).toFixed(2) : '0'}`
    );
    console.log(`[PlayerYearStatsPhase] ============================`);
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
      currentPhase: 'PLAYER_YEAR_STATS',
      currentBatch: batchIndex,
      lastProcessedId:
        processedIds.length > 0 ? processedIds[processedIds.length - 1] : null,
      processedIds,
      progress: Math.floor(((batchIndex + 1) / totalBatches) * 100),
    };
  }
}
