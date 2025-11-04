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

    // Get system user ID for imports (needed for incremental saves)
    const systemUserId = await this.orchestrator.getSystemUser();

    // Track what's been saved to avoid duplicates during incremental saves
    const savedClubIds = new Set<string>();
    let totalSaved = 0;
    let skippedPages: number[] = [];

    // Scrape all clubs with progress callback and incremental saving
    const result = await this.clubsScraper.scrapeAllClubs({
      year: new Date().getFullYear(),
      region: 'all',
      skipOnError: true, // Skip problematic pages instead of failing completely
      onProgress: (pageNumber: number, currentTotal: number) => {
        // Update metrics during scraping so UI sees progress
        this.orchestrator.updateValidationMetrics({
          totalFetched: currentTotal,
        });
      },
      onPageData: async (pageNumber: number, pageData: ClubRawData[]) => {
        // Incrementally save each page's data as it's scraped
        // This ensures we don't lose data if scraping fails later
        await this.savePageData(pageData, systemUserId, savedClubIds);
        totalSaved += pageData.length;
        console.log(
          `[ClubsPhase] Saved page ${pageNumber}: ${pageData.length} clubs (total saved: ${totalSaved})`
        );
      },
    });

    const rawClubs = result.data;
    skippedPages = result.skippedPages;

    // Store skipped pages in orchestrator for later retrieval
    if (skippedPages.length > 0) {
      this.orchestrator.recordSkippedPages('CLUBS', skippedPages);
      console.warn(
        `[ClubsPhase] Skipped pages detected: ${skippedPages.join(', ')}`
      );
    }

    console.log(
      `[ClubsPhase] Scraped ${rawClubs.length} clubs (${totalSaved} already saved incrementally)`
    );
    if (skippedPages.length > 0) {
      // Attempt to retry skipped pages
      if (skippedPages.length <= 5) {
        // Only retry if reasonable number of pages
        console.log(
          `[ClubsPhase] Attempting to retry ${skippedPages.length} skipped pages...`
        );
        try {
          const retriedClubs = await this.clubsScraper.retrySkippedPages(
            skippedPages,
            {
              year: new Date().getFullYear(),
              region: 'all',
              onPageData: async (
                pageNumber: number,
                pageData: ClubRawData[]
              ) => {
                await this.savePageData(pageData, systemUserId, savedClubIds);
                totalSaved += pageData.length;
              },
            }
          );
          console.log(
            `[ClubsPhase] Successfully retried ${retriedClubs.length} clubs from skipped pages`
          );
        } catch (error) {
          console.error('[ClubsPhase] Error retrying skipped pages:', error);
        }
      }
    }

    // Filter valid and non-duplicate clubs (only process what wasn't already saved)
    const validClubs: ClubRawData[] = [];
    let invalidCount = 0;
    let duplicateCount = 0;
    let alreadySavedCount = 0;

    for (const club of rawClubs) {
      // Skip if already saved incrementally
      if (savedClubIds.has(club.gomafiaId)) {
        alreadySavedCount++;
        continue;
      }

      // Validate
      const isValid = await this.validateData(club);
      if (!isValid) {
        invalidCount++;
        continue;
      }

      // Check duplicate in database
      const isDuplicate = await this.checkDuplicate(club.gomafiaId);
      if (isDuplicate) {
        duplicateCount++;
        savedClubIds.add(club.gomafiaId); // Track it to avoid checking again
        continue;
      }

      validClubs.push(club);
    }

    console.log(
      `[ClubsPhase] Valid: ${validClubs.length}, Invalid: ${invalidCount}, Duplicates: ${duplicateCount}, Already Saved: ${alreadySavedCount}`
    );

    // Update orchestrator metrics
    this.orchestrator.updateValidationMetrics({
      totalFetched: rawClubs.length,
      validRecords: validClubs.length + totalSaved,
      invalidRecords: invalidCount,
      duplicatesSkipped: duplicateCount + alreadySavedCount,
    });

    // Batch insert remaining valid clubs (those not saved incrementally)
    if (validClubs.length > 0) {
      const batchProcessor = this.orchestrator.getBatchProcessor();

      await batchProcessor.process(
        validClubs,
        async (batch, batchIndex, totalBatches) => {
          // Transform to Prisma format
          const clubsToInsert = (batch as ClubRawData[]).map(
            (club: ClubRawData) => ({
              gomafiaId: club.gomafiaId,
              name: club.name,
              region: this.normalizeRegion(club.region),
              // presidentId will be set later after players are imported
              createdBy: systemUserId, // System user for imports
              lastSyncAt: new Date(),
              syncStatus: 'SYNCED' as const,
            })
          );

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
            (batch as ClubRawData[]).map((c: ClubRawData) => c.gomafiaId)
          );
          await this.orchestrator.saveCheckpoint(checkpoint);

          console.log(
            `[ClubsPhase] Imported batch ${batchIndex + 1}/${totalBatches} (${clubsToInsert.length} clubs)`
          );
        }
      );
    } else {
      console.log('[ClubsPhase] All clubs were already saved incrementally');
    }

    console.log(
      `[ClubsPhase] Clubs import complete. Total saved: ${totalSaved + validClubs.length}`
    );
  }

  /**
   * Save a page's data incrementally during scraping.
   * This ensures data is persisted even if scraping fails later.
   */
  private async savePageData(
    pageData: ClubRawData[],
    systemUserId: string,
    savedClubIds: Set<string>
  ): Promise<void> {
    // Filter valid clubs
    const validClubs: ClubRawData[] = [];

    for (const club of pageData) {
      // Validate
      const isValid = await this.validateData(club);
      if (!isValid) {
        continue;
      }

      // Check if already exists
      const isDuplicate = await this.checkDuplicate(club.gomafiaId);
      if (isDuplicate) {
        savedClubIds.add(club.gomafiaId);
        continue;
      }

      validClubs.push(club);
    }

    if (validClubs.length === 0) {
      return;
    }

    // Transform to Prisma format
    const clubsToInsert = validClubs.map((club) => ({
      gomafiaId: club.gomafiaId,
      name: club.name,
      region: this.normalizeRegion(club.region),
      createdBy: systemUserId,
      lastSyncAt: new Date(),
      syncStatus: 'SYNCED' as const,
    }));

    // Insert batch
    try {
      await resilientDB.execute((db) =>
        db.club.createMany({
          data: clubsToInsert,
          skipDuplicates: true,
        })
      );

      // Mark as saved
      validClubs.forEach((club) => savedClubIds.add(club.gomafiaId));
    } catch (error) {
      console.error(
        '[ClubsPhase] Error saving page data incrementally:',
        error
      );
      // Don't throw - continue scraping even if save fails
    }
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
