import { ImportOrchestrator } from '../import-orchestrator';
import { ImportCheckpoint } from '../checkpoint-manager';
import { PlayersScraper } from '../../scrapers/players-scraper';
import { resilientDB } from '@/lib/db-resilient';
import { playerSchema, PlayerRawData } from '../../validators/player-schema';
import { normalizeRegion } from '../../parsers/region-normalizer';
import { findClubsByNames } from '../../parsers/club-matcher';

/**
 * Phase 2: Import players from gomafia.pro/rating
 *
 * Players are imported after clubs so they can be linked to their clubs.
 */
export class PlayersPhase {
  private playersScraper: PlayersScraper | null = null;

  constructor(private orchestrator: ImportOrchestrator) {}

  /**
   * Initialize scraper with browser page.
   */
  private async initializeScraper(): Promise<void> {
    if (this.playersScraper) return;

    const browser = this.orchestrator.getBrowser();
    const rateLimiter = this.orchestrator.getRateLimiter();
    const page = await browser.newPage();
    this.playersScraper = new PlayersScraper(page, rateLimiter);
  }

  /**
   * Get phase name.
   */
  getPhaseName(): 'PLAYERS' {
    return 'PLAYERS';
  }

  /**
   * Execute the players import phase.
   */
  async execute(): Promise<void> {
    console.log('[PlayersPhase] Starting players import...');

    // Initialize scraper
    await this.initializeScraper();
    if (!this.playersScraper) {
      throw new Error('Failed to initialize players scraper');
    }

    // Get system user ID for imports (needed for incremental saves)
    const systemUserId = await this.orchestrator.getSystemUser();

    // Track what's been saved to avoid duplicates during incremental saves
    const savedPlayerIds = new Set<string>();
    let totalSaved = 0;

    // Scrape all players with progress callback and incremental saving
    const result = await this.playersScraper.scrapeAllPlayers({
      year: new Date().getFullYear(),
      region: 'all',
      skipOnError: true, // Skip problematic pages instead of failing completely
      onProgress: (pageNumber: number, currentTotal: number) => {
        // Update metrics during scraping so UI sees progress
        this.orchestrator.updateValidationMetrics({
          totalFetched: currentTotal,
        });
      },
      onPageData: async (pageNumber: number, pageData: PlayerRawData[]) => {
        // Incrementally save each page's data as it's scraped
        // This ensures we don't lose data if scraping fails later
        await this.savePageData(pageData, systemUserId, savedPlayerIds);
        totalSaved += pageData.length;
        console.log(
          `[PlayersPhase] Saved page ${pageNumber}: ${pageData.length} players (total saved: ${totalSaved})`
        );
      },
    });

    const rawPlayers = result.data;
    const skippedPages = result.skippedPages;

    // Store skipped pages in orchestrator for later retrieval
    if (skippedPages.length > 0) {
      this.orchestrator.recordSkippedPages('PLAYERS', skippedPages);
      console.warn(
        `[PlayersPhase] Skipped pages detected: ${skippedPages.join(', ')}`
      );
    }

    console.log(
      `[PlayersPhase] Scraped ${rawPlayers.length} players (${totalSaved} already saved incrementally)`
    );

    // Attempt to retry skipped pages if reasonable number
    if (skippedPages.length > 0) {
      if (skippedPages.length <= 5) {
        // Only retry if reasonable number of pages
        console.log(
          `[PlayersPhase] Attempting to retry ${skippedPages.length} skipped pages...`
        );
        try {
          const retriedPlayers = await this.playersScraper.retrySkippedPages(
            skippedPages,
            {
              year: new Date().getFullYear(),
              region: 'all',
              onPageData: async (
                pageNumber: number,
                pageData: PlayerRawData[]
              ) => {
                await this.savePageData(pageData, systemUserId, savedPlayerIds);
                totalSaved += pageData.length;
              },
            }
          );
          console.log(
            `[PlayersPhase] Successfully retried ${retriedPlayers.length} players from skipped pages`
          );
        } catch (error) {
          console.error('[PlayersPhase] Error retrying skipped pages:', error);
        }
      }
    }

    // Filter valid and non-duplicate players (only process what wasn't already saved)
    const validPlayers: PlayerRawData[] = [];
    let invalidCount = 0;
    let duplicateCount = 0;
    let alreadySavedCount = 0;

    for (const player of rawPlayers) {
      // Skip if already saved incrementally
      if (savedPlayerIds.has(player.gomafiaId)) {
        alreadySavedCount++;
        continue;
      }

      // Validate
      const isValid = await this.validateData(player);
      if (!isValid) {
        invalidCount++;
        continue;
      }

      // Check duplicate in database
      const isDuplicate = await this.checkDuplicate(player.gomafiaId);
      if (isDuplicate) {
        duplicateCount++;
        savedPlayerIds.add(player.gomafiaId); // Track it to avoid checking again
        continue;
      }

      validPlayers.push(player);
    }

    console.log(
      `[PlayersPhase] Valid: ${validPlayers.length}, Invalid: ${invalidCount}, Duplicates: ${duplicateCount}, Already Saved: ${alreadySavedCount}`
    );

    // Update orchestrator metrics
    this.orchestrator.updateValidationMetrics({
      totalFetched: rawPlayers.length,
      validRecords: validPlayers.length + totalSaved,
      invalidRecords: invalidCount,
      duplicatesSkipped: duplicateCount + alreadySavedCount,
    });

    // Batch insert remaining valid players (those not saved incrementally)
    if (validPlayers.length > 0) {
      const batchProcessor = this.orchestrator.getBatchProcessor();

      await batchProcessor.process(
        validPlayers,
        async (batch, batchIndex, totalBatches) => {
          // Transform to Prisma format
          // Batch find all clubs for better performance
          const clubNames = (batch as PlayerRawData[])
            .map((p) => p.club)
            .filter((c): c is string => !!c);
          const clubMap = await findClubsByNames(clubNames);

          const playersToInsert = (batch as PlayerRawData[]).map((player) => {
            // Find club by name if provided
            const clubId = player.club ? clubMap.get(player.club) : undefined;

            return {
              gomafiaId: player.gomafiaId,
              name: player.name,
              region: this.normalizeRegion(player.region),
              clubId,
              eloRating: Math.round(player.elo),
              totalGames: player.tournaments, // Using tournaments as proxy for now
              wins: 0, // Will be calculated later
              losses: 0, // Will be calculated later
              userId: systemUserId, // System user for imports
              lastSyncAt: new Date(),
              syncStatus: 'SYNCED' as const,
            };
          });

          // Insert batch
          await resilientDB.execute((db) =>
            db.player.createMany({
              data: playersToInsert,
              skipDuplicates: true,
            })
          );

          // Save checkpoint
          const checkpoint = this.createCheckpoint(
            batchIndex,
            totalBatches,
            (batch as PlayerRawData[]).map((p: PlayerRawData) => p.gomafiaId)
          );
          await this.orchestrator.saveCheckpoint(checkpoint);

          console.log(
            `[PlayersPhase] Imported batch ${batchIndex + 1}/${totalBatches} (${playersToInsert.length} players)`
          );
        }
      );
    } else {
      console.log(
        '[PlayersPhase] All players were already saved incrementally'
      );
    }

    console.log(
      `[PlayersPhase] Players import complete. Total saved: ${totalSaved + validPlayers.length}`
    );
  }

  /**
   * Save a page's data incrementally during scraping.
   * This ensures data is persisted even if scraping fails later.
   */
  private async savePageData(
    pageData: PlayerRawData[],
    systemUserId: string,
    savedPlayerIds: Set<string>
  ): Promise<void> {
    // Filter valid players
    const validPlayers: PlayerRawData[] = [];

    for (const player of pageData) {
      // Validate
      const isValid = await this.validateData(player);
      if (!isValid) {
        continue;
      }

      // Check if already exists
      const isDuplicate = await this.checkDuplicate(player.gomafiaId);
      if (isDuplicate) {
        savedPlayerIds.add(player.gomafiaId);
        continue;
      }

      validPlayers.push(player);
    }

    if (validPlayers.length === 0) {
      return;
    }

    // Batch find all clubs for better performance
    const clubNames = validPlayers
      .map((p) => p.club)
      .filter((c): c is string => !!c);
    const clubMap = await findClubsByNames(clubNames);

    // Transform to Prisma format
    const playersToInsert = validPlayers.map((player) => {
      // Find club by name if provided
      const clubId = player.club ? clubMap.get(player.club) : undefined;

      return {
        gomafiaId: player.gomafiaId,
        name: player.name,
        region: this.normalizeRegion(player.region),
        clubId,
        eloRating: Math.round(player.elo),
        totalGames: player.tournaments,
        wins: 0,
        losses: 0,
        userId: systemUserId,
        lastSyncAt: new Date(),
        syncStatus: 'SYNCED' as const,
      };
    });

    // Insert batch
    try {
      await resilientDB.execute((db) =>
        db.player.createMany({
          data: playersToInsert,
          skipDuplicates: true,
        })
      );

      // Mark as saved
      validPlayers.forEach((player) => savedPlayerIds.add(player.gomafiaId));
    } catch (error) {
      console.error(
        '[PlayersPhase] Error saving page data incrementally:',
        error
      );
      // Don't throw - continue scraping even if save fails
    }
  }

  /**
   * Validate player data with Zod schema.
   */
  async validateData(data: PlayerRawData): Promise<boolean> {
    const result = playerSchema.safeParse(data);
    if (!result.success) {
      console.log(`[PlayersPhase] Validation failed for player:`, {
        gomafiaId: data.gomafiaId,
        name: data.name,
        errors: result.error.issues,
      });
    }
    return result.success;
  }

  /**
   * Check if player already exists.
   */
  async checkDuplicate(gomafiaId: string): Promise<boolean> {
    return await this.orchestrator.checkDuplicate('Player', gomafiaId);
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
      currentPhase: 'PLAYERS',
      currentBatch: batchIndex,
      lastProcessedId:
        processedIds.length > 0 ? processedIds[processedIds.length - 1] : null,
      processedIds,
      progress: Math.floor(((batchIndex + 1) / totalBatches) * 100),
    };
  }

  /**
   * Normalize region name.
   */
  normalizeRegion(region: string | null): string | null {
    return normalizeRegion(region);
  }
}
