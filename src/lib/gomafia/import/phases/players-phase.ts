import { ImportOrchestrator } from '../import-orchestrator';
import { ImportCheckpoint } from '../checkpoint-manager';
import { PlayersScraper } from '../../scrapers/players-scraper';
import { playerSchema, PlayerRawData } from '../../validators/player-schema';
import { normalizeRegion } from '../../parsers/region-normalizer';

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

    // Scrape all players
    const rawPlayers = await this.playersScraper.scrapeAllPlayers({
      year: new Date().getFullYear(),
      region: 'all',
    });

    console.log(`[PlayersPhase] Scraped ${rawPlayers.length} players`);

    // Filter valid and non-duplicate players
    const validPlayers: PlayerRawData[] = [];
    let invalidCount = 0;
    let duplicateCount = 0;

    for (const player of rawPlayers) {
      // Validate
      const isValid = await this.validateData(player);
      if (!isValid) {
        invalidCount++;
        continue;
      }

      // Check duplicate
      const isDuplicate = await this.checkDuplicate(player.gomafiaId);
      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      validPlayers.push(player);
    }

    console.log(
      `[PlayersPhase] Valid: ${validPlayers.length}, Invalid: ${invalidCount}, Duplicates: ${duplicateCount}`
    );

    // Update orchestrator metrics
    this.orchestrator.updateValidationMetrics({
      totalFetched: rawPlayers.length,
      validRecords: validPlayers.length,
      invalidRecords: invalidCount,
      duplicatesSkipped: duplicateCount,
    });

    // Batch insert
    const batchProcessor = this.orchestrator.getBatchProcessor();

    await batchProcessor.process(
      validPlayers,
      async (batch, batchIndex, totalBatches) => {
        // Transform to Prisma format
        const playersToInsert = await Promise.all(
          batch.map(async (player) => {
            // Find club by name if provided
            let clubId: string | undefined;
            if (player.club) {
              const club = await this.orchestrator['db'].club.findFirst({
                where: { name: player.club },
              });
              clubId = club?.id;
            }

            return {
              gomafiaId: player.gomafiaId,
              name: player.name,
              region: this.normalizeRegion(player.region),
              clubId,
              eloRating: Math.round(player.elo),
              totalGames: player.tournaments, // Using tournaments as proxy for now
              wins: 0, // Will be calculated later
              losses: 0, // Will be calculated later
              userId: 'import-system', // TODO: Get or create system user
              lastSyncAt: new Date(),
              syncStatus: 'SYNCED' as const,
            };
          })
        );

        // Insert batch
        await this.orchestrator['db'].player.createMany({
          data: playersToInsert,
          skipDuplicates: true,
        });

        // Save checkpoint
        const checkpoint = this.createCheckpoint(
          batchIndex,
          totalBatches,
          batch.map((p) => p.gomafiaId)
        );
        await this.orchestrator.saveCheckpoint(checkpoint);

        console.log(
          `[PlayersPhase] Imported batch ${batchIndex + 1}/${totalBatches}`
        );
      }
    );

    console.log('[PlayersPhase] Players import complete');
  }

  /**
   * Validate player data with Zod schema.
   */
  async validateData(data: PlayerRawData): Promise<boolean> {
    const result = playerSchema.safeParse(data);
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
