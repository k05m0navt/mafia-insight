import { ImportOrchestrator } from '../import-orchestrator';
import { ImportCheckpoint } from '../checkpoint-manager';
import { PlayerTournamentHistoryScraper } from '../../scrapers/player-tournament-history-scraper';
import { resilientDB } from '@/lib/db-resilient';

/**
 * Phase 5: Import player-tournament participation history
 *
 * For each player, scrapes tournament history from gomafia.pro/stats/{id}?tab=history including:
 * - Placement/rank
 * - GG Points earned
 * - ELO change
 * - Prize money won
 */
export class PlayerTournamentPhase {
  private playerTournamentHistoryScraper: PlayerTournamentHistoryScraper | null =
    null;
  private static readonly PARALLEL_CONCURRENCY = parseInt(
    process.env.PLAYER_TOURNAMENT_PARALLEL_CONCURRENCY || '5'
  ); // Number of parallel browser pages

  constructor(private orchestrator: ImportOrchestrator) {}

  /**
   * Initialize scraper with browser page.
   * NOTE: With parallel processing, this is now only used for compatibility.
   * Each parallel task creates its own page and scraper.
   */
  private async initializeScraper(): Promise<void> {
    if (this.playerTournamentHistoryScraper) return;

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

    const rateLimiter = this.orchestrator.getRateLimiter();
    this.playerTournamentHistoryScraper = new PlayerTournamentHistoryScraper(
      page,
      rateLimiter
    );
  }

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

    // Initialize scraper
    await this.initializeScraper();
    if (!this.playerTournamentHistoryScraper) {
      throw new Error('Failed to initialize player tournament history scraper');
    }

    // Get all players
    const players = (await resilientDB.execute((db) =>
      db.player.findMany({
        select: { id: true, gomafiaId: true, name: true },
      })
    )) as Array<{ id: string; gomafiaId: string; name: string }>;

    console.log(
      `[PlayerTournamentPhase] Found ${players.length} players to process`
    );

    // Reset and set total records for progress tracking
    this.orchestrator.updateValidationMetrics({
      totalFetched: players.length,
      validRecords: 0, // Start with 0 processed
      invalidRecords: 0, // Reset error count
    });

    const startTime = Date.now();
    let totalLinks = 0;
    let errorCount = 0;
    let processedPlayers = 0;
    let playersWithHistory = 0;
    let playersWithoutHistory = 0;

    // Process players in batches
    const batchProcessor = this.orchestrator.getBatchProcessor();

    await batchProcessor.process(
      players,
      async (batch, batchIndex, totalBatches) => {
        const batchStartTime = Date.now();

        // OPTIMIZATION: Process players in parallel using multiple pages
        const chunkSize = PlayerTournamentPhase.PARALLEL_CONCURRENCY;
        const INSERT_FREQUENCY = 10; // Insert after every 10 players scraped

        // Track accumulated links across chunks
        const batchLinksToInsert: Array<{
          playerId: string;
          tournamentId: string;
          placement: number | null;
          ggPoints: number | null;
          eloChange: number | null;
          prizeMoney: number | null;
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

                // PERFORMANCE: Block more resources - CSS, stylesheets, analytics, etc.
                // This can improve page load time by 40-60% (based on web scraping best practices)
                await page.route('**/*', (route) => {
                  const resourceType = route.request().resourceType();
                  const url = route.request().url();
                  // Block images, fonts, media, stylesheets, and analytics
                  if (
                    ['image', 'font', 'media', 'stylesheet'].includes(
                      resourceType
                    ) ||
                    url.includes('analytics') ||
                    url.includes('tracking') ||
                    url.includes('facebook.com') ||
                    url.includes('google-analytics')
                  ) {
                    route.abort();
                  } else {
                    route.continue();
                  }
                });

                const rateLimiter = this.orchestrator.getRateLimiter();
                const scraper = new PlayerTournamentHistoryScraper(
                  page,
                  rateLimiter
                );

                // Scrape tournament history for this player
                const tournamentHistory = await scraper.scrapeHistory(
                  player.gomafiaId
                );

                // Clean up page
                await page.close();

                if (tournamentHistory.length > 0) {
                  // Store raw history data with player info for batch lookup
                  return {
                    success: true,
                    playerId: player.id,
                    tournamentHistory,
                    hasHistory: true,
                  };
                } else {
                  return {
                    success: true,
                    playerId: player.id,
                    tournamentHistory: [],
                    hasHistory: false,
                  };
                }
              } catch (error) {
                console.error(
                  `[PlayerTournamentPhase] Failed to scrape tournament history for player ${player.name} (ID: ${player.gomafiaId}):`,
                  error instanceof Error ? error.message : error
                );
                return {
                  success: false,
                  playerId: player.id,
                  tournamentHistory: [],
                  hasHistory: false,
                };
              }
            })
          );

          // PERFORMANCE OPTIMIZATION: Batch tournament lookups to avoid N+1 query problem
          // Collect all unique tournament IDs from all players in this chunk
          const allTournamentGomafiaIds = new Set<string>();
          for (const result of chunkResults) {
            if (
              result.tournamentHistory &&
              result.tournamentHistory.length > 0
            ) {
              for (const history of result.tournamentHistory) {
                allTournamentGomafiaIds.add(history.tournamentId);
              }
            }
          }

          // Single batch query to get all tournaments at once
          const tournamentMap = new Map<string, string>(); // gomafiaId -> dbId
          if (allTournamentGomafiaIds.size > 0) {
            const tournaments = await resilientDB.execute((db) =>
              db.tournament.findMany({
                where: {
                  gomafiaId: { in: Array.from(allTournamentGomafiaIds) },
                },
                select: { id: true, gomafiaId: true },
              })
            );

            // Log tournament lookup results for debugging
            if (tournaments.length < allTournamentGomafiaIds.size) {
              const missingIds = Array.from(allTournamentGomafiaIds).filter(
                (id) => !tournaments.find((t) => t.gomafiaId === id)
              );
              console.warn(
                `[PlayerTournamentPhase] Found ${tournaments.length}/${allTournamentGomafiaIds.size} tournaments in database. ` +
                  `Missing tournaments: ${missingIds.slice(0, 5).join(', ')}${missingIds.length > 5 ? '...' : ''}`
              );
            }

            for (const tournament of tournaments) {
              if (tournament.gomafiaId) {
                tournamentMap.set(tournament.gomafiaId, tournament.id);
              }
            }
          }

          // Now build the insert data using the tournament map
          let chunkLinksAdded = 0;
          let chunkTournamentsMissing = 0;
          for (const result of chunkResults) {
            if (
              result.success &&
              result.tournamentHistory &&
              result.tournamentHistory.length > 0
            ) {
              for (const history of result.tournamentHistory) {
                const tournamentDbId = tournamentMap.get(history.tournamentId);
                if (tournamentDbId) {
                  batchLinksToInsert.push({
                    playerId: result.playerId,
                    tournamentId: tournamentDbId,
                    placement: history.placement,
                    ggPoints: history.ggPoints,
                    eloChange: history.eloChange,
                    prizeMoney: history.prizeMoney,
                  });
                  chunkLinksAdded++;
                } else {
                  // Tournament not found
                  if (!tournamentMap.has(history.tournamentId)) {
                    tournamentMap.set(history.tournamentId, ''); // Mark as checked to avoid duplicate warnings
                    chunkTournamentsMissing++;
                  }
                }
              }
            }
          }

          // Log chunk results for debugging
          if (chunkLinksAdded > 0) {
            console.log(
              `[PlayerTournamentPhase] Chunk processed: ${chunkLinksAdded} tournament links prepared for insert`
            );
          }
          if (chunkTournamentsMissing > 0) {
            console.warn(
              `[PlayerTournamentPhase] Chunk warning: ${chunkTournamentsMissing} tournaments from scraped history were not found in database`
            );
          }

          // Aggregate chunk results to update shared counters atomically
          for (const result of chunkResults) {
            processedPlayers++;

            if (result.hasHistory) {
              playersWithHistory++;
              // Count tournaments from tournamentHistory array
              totalLinks += result.tournamentHistory?.length || 0;
            } else {
              playersWithoutHistory++;
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
            `[PlayerTournamentPhase] Progress: ${processedPlayers}/${players.length} players (${progress}%) | ` +
              `Tournaments: ${totalLinks} | ` +
              `With history: ${playersWithHistory} | Without: ${playersWithoutHistory} | ` +
              `Errors: ${errorCount}`
          );

          // PERFORMANCE: Insert after every 10 players instead of waiting for entire batch
          // This provides better visibility and faster data persistence
          if (
            processedPlayers % INSERT_FREQUENCY === 0 ||
            i + chunkSize >= batch.length
          ) {
            if (batchLinksToInsert.length > 0) {
              const insertStartTime = Date.now();
              try {
                const result = await resilientDB.execute((db) =>
                  db.playerTournament.createMany({
                    data: batchLinksToInsert,
                    skipDuplicates: true,
                  })
                );
                const insertDuration = Date.now() - insertStartTime;
                console.log(
                  `[PlayerTournamentPhase] ✅ Insert after ${processedPlayers} players: ${batchLinksToInsert.length} records prepared, ` +
                    `${result.count} records inserted (${batchLinksToInsert.length - result.count} skipped as duplicates) ` +
                    `in ${insertDuration}ms`
                );

                // Clear the array after successful insert to avoid duplicate inserts
                batchLinksToInsert.length = 0;
              } catch (insertError) {
                console.error(
                  `[PlayerTournamentPhase] ❌ Insert FAILED after ${processedPlayers} players:`,
                  insertError instanceof Error
                    ? insertError.message
                    : insertError
                );
                // Log full error stack if available
                if (insertError instanceof Error && insertError.stack) {
                  console.error(
                    `[PlayerTournamentPhase] Error stack:`,
                    insertError.stack
                  );
                }
              }
            }
          }
        }

        // Final insert for any remaining links at end of batch (if not already inserted)
        if (batchLinksToInsert.length > 0) {
          const insertStartTime = Date.now();
          try {
            const result = await resilientDB.execute((db) =>
              db.playerTournament.createMany({
                data: batchLinksToInsert,
                skipDuplicates: true,
              })
            );
            const insertDuration = Date.now() - insertStartTime;
            console.log(
              `[PlayerTournamentPhase] ✅ Final insert for batch ${batchIndex + 1}/${totalBatches}: ` +
                `${batchLinksToInsert.length} records prepared, ${result.count} records inserted ` +
                `(${batchLinksToInsert.length - result.count} skipped as duplicates) in ${insertDuration}ms`
            );
          } catch (insertError) {
            console.error(
              `[PlayerTournamentPhase] ❌ Final insert FAILED for batch ${batchIndex + 1}/${totalBatches}:`,
              insertError instanceof Error ? insertError.message : insertError
            );
            if (insertError instanceof Error && insertError.stack) {
              console.error(
                `[PlayerTournamentPhase] Error stack:`,
                insertError.stack
              );
            }
          }
        }

        console.log(
          `[PlayerTournamentPhase] Batch ${batchIndex + 1}/${totalBatches} completed. ` +
            `Processed ${batch.length} players in this batch.`
        );

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
          `[PlayerTournamentPhase] Batch ${batchIndex + 1}/${totalBatches} complete in ${Math.round(batchDuration / 1000)}s | ` +
            `Processed: ${processedPlayers}/${players.length} players | ` +
            `Tournament records imported: ${totalLinks} | ` +
            `Players with history: ${playersWithHistory} | ` +
            `Players without history: ${playersWithoutHistory} | ` +
            `Errors: ${errorCount} | ` +
            `Estimated remaining: ~${estimatedRemaining}s`
        );
      }
    );

    const totalDuration = Date.now() - startTime;
    const avgTimePerPlayer = totalDuration / players.length;

    console.log(`[PlayerTournamentPhase] ===== Import Complete =====`);
    console.log(
      `[PlayerTournamentPhase] Total players processed: ${processedPlayers}/${players.length}`
    );
    console.log(
      `[PlayerTournamentPhase] Players with history: ${playersWithHistory} (${Math.round((playersWithHistory / processedPlayers) * 100)}%)`
    );
    console.log(
      `[PlayerTournamentPhase] Players without history: ${playersWithoutHistory}`
    );
    console.log(
      `[PlayerTournamentPhase] Total tournament records imported: ${totalLinks}`
    );
    console.log(`[PlayerTournamentPhase] Errors encountered: ${errorCount}`);
    console.log(
      `[PlayerTournamentPhase] Total duration: ${Math.round(totalDuration / 1000)}s (${Math.round(totalDuration / 60000)}m ${Math.round((totalDuration % 60000) / 1000)}s)`
    );
    console.log(
      `[PlayerTournamentPhase] Average time per player: ${Math.round(avgTimePerPlayer)}ms`
    );
    console.log(
      `[PlayerTournamentPhase] Average tournaments per player: ${totalLinks > 0 ? (totalLinks / playersWithHistory).toFixed(2) : '0'}`
    );
    console.log(`[PlayerTournamentPhase] ============================`);
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
