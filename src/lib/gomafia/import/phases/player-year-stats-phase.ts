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

    let totalStats = 0;
    let errorCount = 0;

    // Process players in batches
    const batchProcessor = this.orchestrator.getBatchProcessor();

    await batchProcessor.process(
      players,
      async (batch, batchIndex, totalBatches) => {
        const statsToInsert: Array<{
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

        for (const player of batch) {
          try {
            // Scrape year stats for this player
            const yearStats = await this.playerStatsScraper!.scrapeAllYears(
              player.gomafiaId
            );

            // Transform to Prisma format
            for (const stats of yearStats) {
              statsToInsert.push({
                playerId: player.id,
                year: stats.year,
                totalGames: stats.totalGames,
                donGames: stats.donGames,
                mafiaGames: stats.mafiaGames,
                sheriffGames: stats.sheriffGames,
                civilianGames: stats.civilianGames,
                eloRating: stats.eloRating,
                extraPoints: stats.extraPoints,
              });
            }

            totalStats += yearStats.length;
          } catch (error) {
            console.error(
              `[PlayerYearStatsPhase] Failed to scrape stats for player ${player.name}:`,
              error
            );
            errorCount++;
          }
        }

        // Bulk insert stats
        if (statsToInsert.length > 0) {
          await resilientDB.execute((db) =>
            db.playerYearStats.createMany({
              data: statsToInsert,
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
          `[PlayerYearStatsPhase] Processed batch ${batchIndex + 1}/${totalBatches} (${totalStats} stats imported, ${errorCount} errors)`
        );
      }
    );

    console.log(
      `[PlayerYearStatsPhase] Player year stats import complete (${totalStats} stats, ${errorCount} errors)`
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
      currentPhase: 'PLAYER_YEAR_STATS',
      currentBatch: batchIndex,
      lastProcessedId:
        processedIds.length > 0 ? processedIds[processedIds.length - 1] : null,
      processedIds,
      progress: Math.floor(((batchIndex + 1) / totalBatches) * 100),
    };
  }
}
