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
  private static readonly PARALLEL_CONCURRENCY = parseInt(
    process.env.PLAYER_STATS_PARALLEL_CONCURRENCY || '5'
  ); // Number of parallel browser pages

  constructor(private orchestrator: ImportOrchestrator) {}

  /**
   * Initialize scraper with browser page.
   * NOTE: With parallel processing, this is now only used for compatibility.
   * Each parallel task creates its own page and scraper.
   */
  private async initializeScraper(): Promise<void> {
    if (this.playerStatsScraper) return;

    const browser = this.orchestrator.getBrowser();
    const page = await browser.newPage();

    // OPTIMIZATION: Block images, fonts, and media to reduce page load time by ~20-30%
    // Only load HTML and JavaScript required for dynamic content
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      // Block unnecessary resources but allow document and scripts
      if (['image', 'font', 'media'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

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

        // OPTIMIZATION: Process players in parallel using multiple pages
        const chunkSize = PlayerYearStatsPhase.PARALLEL_CONCURRENCY;

        // Collect all stats for batch insert
        const batchStatsToInsert: Array<{
          playerId: string;
          year: number;
          totalGames: number;
          donGames: number;
          mafiaGames: number;
          sheriffGames: number;
          civilianGames: number;
          eloRating: number | null;
          extraPoints: number;
        }> = [];

        for (let i = 0; i < batch.length; i += chunkSize) {
          // Check for cancellation before processing next chunk
          this.orchestrator.checkCancellation();

          const chunk = (
            batch as Array<{
              id: string;
              name: string;
              gomafiaId: string;
            }>
          ).slice(i, i + chunkSize);

          // Process chunk in parallel and collect results to avoid race conditions
          const chunkResults = await Promise.all(
            chunk.map(async (player) => {
              try {
                // Create a new scraper instance for this parallel execution
                const browser = this.orchestrator.getBrowser();
                const page = await browser.newPage();

                // OPTIMIZATION: Block images, fonts, and media to reduce page load time by ~20-30%
                await page.route('**/*', (route) => {
                  const resourceType = route.request().resourceType();
                  if (['image', 'font', 'media'].includes(resourceType)) {
                    route.abort();
                  } else {
                    route.continue();
                  }
                });

                const scraper = new PlayerStatsScraper(page);

                // Scrape year stats for this player
                const yearStats = await scraper.scrapeAllYears(
                  player.gomafiaId
                );

                // Clean up page
                await page.close();

                if (yearStats.length > 0) {
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

                  // Collect stats for batch insert instead of saving immediately
                  batchStatsToInsert.push(...playerStatsToInsert);

                  // Log every player with stats
                  console.log(
                    `[PlayerYearStatsPhase] Player: ${player.name} (ID: ${player.gomafiaId}) | ` +
                      `Year stats: ${yearStats.length} (queued for batch insert)`
                  );

                  return {
                    success: true,
                    stats: yearStats.length,
                    hasStats: true,
                  };
                } else {
                  // Log every player without stats
                  console.log(
                    `[PlayerYearStatsPhase] Player: ${player.name} (ID: ${player.gomafiaId}) | No stats found`
                  );
                  return { success: true, stats: 0, hasStats: false };
                }
              } catch (error) {
                console.error(
                  `[PlayerYearStatsPhase] Failed to scrape stats for player ${player.name} (ID: ${player.gomafiaId}):`,
                  error instanceof Error ? error.message : error
                );
                return { success: false, stats: 0, hasStats: false };
              }
            })
          );

          // Aggregate chunk results to update shared counters atomically
          for (const result of chunkResults) {
            processedPlayers++;

            if (result.hasStats) {
              playersWithStats++;
              totalStats += result.stats;
            } else {
              playersWithoutStats++;
            }

            if (!result.success) {
              errorCount++;
            }
          }

          // Update progress metrics after chunk is complete
          this.orchestrator.updateValidationMetrics({
            validRecords: processedPlayers,
            invalidRecords: errorCount,
          });

          // Log progress after each chunk for better visibility
          const progress = Math.round(
            (processedPlayers / players.length) * 100
          );
          console.log(
            `[PlayerYearStatsPhase] Progress: ${processedPlayers}/${players.length} players (${progress}%) | ` +
              `Stats: ${totalStats} | ` +
              `With stats: ${playersWithStats} | Without: ${playersWithoutStats} | ` +
              `Errors: ${errorCount}`
          );
        }

        // Batch insert all stats at once after processing the entire batch
        if (batchStatsToInsert.length > 0) {
          const insertStartTime = Date.now();
          try {
            await resilientDB.execute((db) =>
              db.playerYearStats.createMany({
                data: batchStatsToInsert,
                skipDuplicates: true,
              })
            );
            const insertDuration = Date.now() - insertStartTime;
            console.log(
              `[PlayerYearStatsPhase] Batch insert: ${batchStatsToInsert.length} stats saved in ${insertDuration}ms`
            );
          } catch (insertError) {
            console.error(
              `[PlayerYearStatsPhase] Batch insert failed:`,
              insertError instanceof Error ? insertError.message : insertError
            );
            // Don't increment errorCount here as we already counted individual scraping errors
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
