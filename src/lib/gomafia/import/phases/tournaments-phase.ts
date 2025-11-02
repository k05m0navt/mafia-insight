import { ImportOrchestrator } from '../import-orchestrator';
import { ImportCheckpoint } from '../checkpoint-manager';
import { TournamentsScraper } from '../../scrapers/tournaments-scraper';
import { resilientDB } from '@/lib/db-resilient';
import {
  tournamentSchema,
  TournamentRawData,
} from '../../validators/tournament-schema';
import { parseGomafiaDate } from '../../parsers/date-parser';

/**
 * Phase 4: Import tournaments from gomafia.pro/tournaments
 *
 * Imports tournament metadata including stars, average ELO, FSM rating, and dates.
 */
export class TournamentsPhase {
  private tournamentsScraper: TournamentsScraper | null = null;

  constructor(private orchestrator: ImportOrchestrator) {}

  /**
   * Initialize scraper with browser page.
   */
  private async initializeScraper(): Promise<void> {
    if (this.tournamentsScraper) return;

    const browser = this.orchestrator.getBrowser();
    const rateLimiter = this.orchestrator.getRateLimiter();
    const page = await browser.newPage();
    this.tournamentsScraper = new TournamentsScraper(page, rateLimiter);
  }

  /**
   * Get phase name.
   */
  getPhaseName(): 'TOURNAMENTS' {
    return 'TOURNAMENTS';
  }

  /**
   * Execute the tournaments import phase.
   */
  async execute(): Promise<void> {
    console.log('[TournamentsPhase] Starting tournaments import...');

    // Initialize scraper
    await this.initializeScraper();
    if (!this.tournamentsScraper) {
      throw new Error('Failed to initialize tournaments scraper');
    }

    // Get system user ID for imports (needed for incremental saves)
    const systemUserId = await this.orchestrator.getSystemUser();

    // Track what's been saved to avoid duplicates during incremental saves
    const savedTournamentIds = new Set<string>();
    let totalSaved = 0;
    let skippedPages: number[] = [];

    // Scrape all tournaments with progress callback and incremental saving
    const result = await this.tournamentsScraper.scrapeAllTournaments({
      timeFilter: 'all',
      skipOnError: true, // Skip problematic pages instead of failing completely
      onProgress: (pageNumber: number, currentTotal: number) => {
        // Update metrics during scraping so UI sees progress
        this.orchestrator.updateValidationMetrics({
          totalFetched: currentTotal,
        });
      },
      onPageData: async (pageNumber: number, pageData: TournamentRawData[]) => {
        // Incrementally save each page's data as it's scraped
        // This ensures we don't lose data if scraping fails later
        await this.savePageData(pageData, systemUserId, savedTournamentIds);
        totalSaved += pageData.length;
        console.log(
          `[TournamentsPhase] Saved page ${pageNumber}: ${pageData.length} tournaments (total saved: ${totalSaved})`
        );
      },
    });

    const rawTournaments = result.data;
    skippedPages = result.skippedPages;

    // Store skipped pages in orchestrator for later retrieval
    if (skippedPages.length > 0) {
      this.orchestrator.recordSkippedPages('TOURNAMENTS', skippedPages);
      console.warn(
        `[TournamentsPhase] Skipped pages detected: ${skippedPages.join(', ')}`
      );
    }

    console.log(
      `[TournamentsPhase] Scraped ${rawTournaments.length} tournaments (${totalSaved} already saved incrementally)`
    );

    if (skippedPages.length > 0) {
      // Attempt to retry skipped pages
      if (skippedPages.length <= 5) {
        // Only retry if reasonable number of pages
        console.log(
          `[TournamentsPhase] Attempting to retry ${skippedPages.length} skipped pages...`
        );
        try {
          const retriedTournaments =
            await this.tournamentsScraper.retrySkippedPages(skippedPages, {
              timeFilter: 'all',
              onPageData: async (
                pageNumber: number,
                pageData: TournamentRawData[]
              ) => {
                await this.savePageData(
                  pageData,
                  systemUserId,
                  savedTournamentIds
                );
                totalSaved += pageData.length;
              },
            });
          console.log(
            `[TournamentsPhase] Successfully retried ${retriedTournaments.length} tournaments from skipped pages`
          );
        } catch (error) {
          console.error(
            '[TournamentsPhase] Error retrying skipped pages:',
            error
          );
        }
      }
    }

    // Filter valid and non-duplicate tournaments (only process what wasn't already saved)
    const validTournaments: TournamentRawData[] = [];
    let invalidCount = 0;
    let duplicateCount = 0;
    let alreadySavedCount = 0;

    for (const tournament of rawTournaments) {
      // Skip if already saved incrementally
      if (savedTournamentIds.has(tournament.gomafiaId)) {
        alreadySavedCount++;
        continue;
      }

      // Validate
      const isValid = await this.validateData(tournament);
      if (!isValid) {
        invalidCount++;
        continue;
      }

      // Check duplicate in database
      const isDuplicate = await this.checkDuplicate(tournament.gomafiaId);
      if (isDuplicate) {
        duplicateCount++;
        savedTournamentIds.add(tournament.gomafiaId); // Track it to avoid checking again
        continue;
      }

      validTournaments.push(tournament);
    }

    console.log(
      `[TournamentsPhase] Valid: ${validTournaments.length}, Invalid: ${invalidCount}, Duplicates: ${duplicateCount}, Already Saved: ${alreadySavedCount}`
    );

    // Update orchestrator metrics
    this.orchestrator.updateValidationMetrics({
      totalFetched: rawTournaments.length,
      validRecords: validTournaments.length + totalSaved,
      invalidRecords: invalidCount,
      duplicatesSkipped: duplicateCount + alreadySavedCount,
    });

    // Batch insert remaining valid tournaments (those not saved incrementally)
    if (validTournaments.length > 0) {
      const batchProcessor = this.orchestrator.getBatchProcessor();

      await batchProcessor.process(
        validTournaments,
        async (batch, batchIndex, totalBatches) => {
          // Transform to Prisma format
          const tournamentsToInsert = (batch as TournamentRawData[]).map(
            (tournament: TournamentRawData) => ({
              gomafiaId: tournament.gomafiaId,
              name: tournament.name,
              stars: tournament.stars,
              averageElo: tournament.averageElo,
              isFsmRated: tournament.isFsmRated,
              startDate: parseGomafiaDate(tournament.startDate),
              endDate: tournament.endDate
                ? parseGomafiaDate(tournament.endDate)
                : null,
              status: tournament.status,
              createdBy: systemUserId, // System user for imports
              lastSyncAt: new Date(),
              syncStatus: 'SYNCED' as const,
            })
          );

          // Insert batch
          await resilientDB.execute((db) =>
            db.tournament.createMany({
              data: tournamentsToInsert,
              skipDuplicates: true,
            })
          );

          // Save checkpoint
          const checkpoint = this.createCheckpoint(
            batchIndex,
            totalBatches,
            (batch as TournamentRawData[]).map(
              (t: TournamentRawData) => t.gomafiaId
            )
          );
          await this.orchestrator.saveCheckpoint(checkpoint);

          console.log(
            `[TournamentsPhase] Imported batch ${batchIndex + 1}/${totalBatches} (${tournamentsToInsert.length} tournaments)`
          );
        }
      );
    } else {
      console.log(
        '[TournamentsPhase] All tournaments were already saved incrementally'
      );
    }

    console.log(
      `[TournamentsPhase] Tournaments import complete. Total saved: ${totalSaved + validTournaments.length}`
    );
  }

  /**
   * Save a page's data incrementally during scraping.
   * This ensures data is persisted even if scraping fails later.
   */
  private async savePageData(
    pageData: TournamentRawData[],
    systemUserId: string,
    savedTournamentIds: Set<string>
  ): Promise<void> {
    // Filter valid tournaments
    const validTournaments: TournamentRawData[] = [];

    for (const tournament of pageData) {
      // Validate
      const isValid = await this.validateData(tournament);
      if (!isValid) {
        continue;
      }

      // Check if already exists
      const isDuplicate = await this.checkDuplicate(tournament.gomafiaId);
      if (isDuplicate) {
        savedTournamentIds.add(tournament.gomafiaId);
        continue;
      }

      validTournaments.push(tournament);
    }

    if (validTournaments.length === 0) {
      return;
    }

    // Transform to Prisma format
    const tournamentsToInsert = validTournaments.map((tournament) => ({
      gomafiaId: tournament.gomafiaId,
      name: tournament.name,
      stars: tournament.stars,
      averageElo: tournament.averageElo,
      isFsmRated: tournament.isFsmRated,
      startDate: parseGomafiaDate(tournament.startDate),
      endDate: tournament.endDate ? parseGomafiaDate(tournament.endDate) : null,
      status: tournament.status,
      createdBy: systemUserId,
      lastSyncAt: new Date(),
      syncStatus: 'SYNCED' as const,
    }));

    // Insert batch
    try {
      await resilientDB.execute((db) =>
        db.tournament.createMany({
          data: tournamentsToInsert,
          skipDuplicates: true,
        })
      );

      // Mark as saved
      validTournaments.forEach((tournament) =>
        savedTournamentIds.add(tournament.gomafiaId)
      );
    } catch (error) {
      console.error(
        '[TournamentsPhase] Error saving page data incrementally:',
        error
      );
      // Don't throw - continue scraping even if save fails
    }
  }

  /**
   * Validate tournament data with Zod schema.
   */
  async validateData(data: TournamentRawData): Promise<boolean> {
    const result = tournamentSchema.safeParse(data);
    if (!result.success) {
      // Log validation errors for debugging
      const errors = result.error.issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        value: err.path.reduce((obj: any, key) => obj?.[key], data),
      }));
      console.warn(
        `[TournamentsPhase] Validation failed for tournament ${data.gomafiaId}:`,
        errors
      );
    }
    return result.success;
  }

  /**
   * Check if tournament already exists.
   */
  async checkDuplicate(gomafiaId: string): Promise<boolean> {
    return await this.orchestrator.checkDuplicate('Tournament', gomafiaId);
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
      currentPhase: 'TOURNAMENTS',
      currentBatch: batchIndex,
      lastProcessedId:
        processedIds.length > 0 ? processedIds[processedIds.length - 1] : null,
      processedIds,
      progress: Math.floor(((batchIndex + 1) / totalBatches) * 100),
    };
  }
}
