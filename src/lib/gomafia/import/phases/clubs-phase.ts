import { ImportOrchestrator } from '../import-orchestrator';
import { ImportCheckpoint } from '../checkpoint-manager';
import { ClubsScraper } from '../../scrapers/clubs-scraper';
import { resilientDB } from '@/lib/db-resilient';
import { clubSchema, ClubRawData } from '../../validators/club-schema';
import { normalizeRegion } from '../../parsers/region-normalizer';

/**
 * Phase 1: Import clubs from gomafia.pro/rating?tab=clubs
 *
 * This is the first phase of the import process. Clubs must be imported
 * before players since players reference clubs.
 */
export class ClubsPhase {
  private clubsScraper: ClubsScraper | null = null;

  constructor(private orchestrator: ImportOrchestrator) {
    // Scraper will be initialized in execute()
  }

  /**
   * Initialize scraper with browser page.
   */
  private async initializeScraper(): Promise<void> {
    if (this.clubsScraper) return;

    const browser = this.orchestrator.getBrowser();
    const rateLimiter = this.orchestrator.getRateLimiter();
    const page = await browser.newPage();
    this.clubsScraper = new ClubsScraper(page, rateLimiter);
  }

  /**
   * Get phase name.
   */
  getPhaseName(): 'CLUBS' {
    return 'CLUBS';
  }

  /**
   * Execute the clubs import phase.
   *
   * Steps:
   * 1. Scrape all clubs from gomafia.pro
   * 2. Validate each club with Zod schema
   * 3. Check for duplicates (skip existing)
   * 4. Batch insert into database
   * 5. Save checkpoint after each batch
   */
  async execute(): Promise<void> {
    console.log('[ClubsPhase] Starting clubs import...');

    // Initialize scraper
    await this.initializeScraper();
    if (!this.clubsScraper) {
      throw new Error('Failed to initialize clubs scraper');
    }

    // Scrape all clubs
    const rawClubs = await this.clubsScraper.scrapeAllClubs({
      year: new Date().getFullYear(),
      region: 'all',
    });

    console.log(`[ClubsPhase] Scraped ${rawClubs.length} clubs`);

    // Filter valid and non-duplicate clubs
    const validClubs: ClubRawData[] = [];
    let invalidCount = 0;
    let duplicateCount = 0;

    for (const club of rawClubs) {
      // Validate
      const isValid = await this.validateData(club);
      if (!isValid) {
        invalidCount++;
        continue;
      }

      // Check duplicate
      const isDuplicate = await this.checkDuplicate(club.gomafiaId);
      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      validClubs.push(club);
    }

    console.log(
      `[ClubsPhase] Valid: ${validClubs.length}, Invalid: ${invalidCount}, Duplicates: ${duplicateCount}`
    );

    // Update orchestrator metrics
    this.orchestrator.updateValidationMetrics({
      totalFetched: rawClubs.length,
      validRecords: validClubs.length,
      invalidRecords: invalidCount,
      duplicatesSkipped: duplicateCount,
    });

    // Batch insert
    const batchProcessor = this.orchestrator.getBatchProcessor();

    await batchProcessor.process(
      validClubs,
      async (batch, batchIndex, totalBatches) => {
        // Transform to Prisma format
        const clubsToInsert = batch.map((club) => ({
          gomafiaId: club.gomafiaId,
          name: club.name,
          region: this.normalizeRegion(club.region),
          // presidentId will be set later after players are imported
          createdBy: 'system-import-user', // System user for imports
          lastSyncAt: new Date(),
          syncStatus: 'SYNCED' as const,
        }));

        // Insert batch
        await resilientDB.execute((db) =>
          db.club.createMany({
            data: clubsToInsert,
            skipDuplicates: true,
          })
        );

        // Save checkpoint
        const checkpoint = this.createCheckpoint(
          batchIndex,
          totalBatches,
          batch.map((c) => c.gomafiaId)
        );
        await this.orchestrator.saveCheckpoint(checkpoint);

        console.log(
          `[ClubsPhase] Imported batch ${batchIndex + 1}/${totalBatches}`
        );
      }
    );

    console.log('[ClubsPhase] Clubs import complete');
  }

  /**
   * Validate club data with Zod schema.
   */
  async validateData(data: ClubRawData): Promise<boolean> {
    const result = clubSchema.safeParse(data);
    return result.success;
  }

  /**
   * Check if club already exists.
   */
  async checkDuplicate(gomafiaId: string): Promise<boolean> {
    return await this.orchestrator.checkDuplicate('Club', gomafiaId);
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
      currentPhase: 'CLUBS',
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
