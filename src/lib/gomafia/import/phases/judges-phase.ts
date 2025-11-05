import { ImportOrchestrator } from '../import-orchestrator';
import { JudgesScraper } from '../../scrapers/judges-scraper';
import { resilientDB } from '@/lib/db-resilient';
import { JudgeRawData } from '@/types/gomafia-entities';

/**
 * Phase: Import judges from gomafia.pro/judges
 *
 * Judges are always players, so this phase:
 * 1. Scrapes judge data from gomafia.pro/judges
 * 2. Finds existing players by gomafiaId
 * 3. Updates players with judge information
 *
 * This phase should run after PLAYERS phase to ensure players exist.
 */
export class JudgesPhase {
  private judgesScraper: JudgesScraper | null = null;

  constructor(private orchestrator: ImportOrchestrator) {
    // Scraper will be initialized in execute()
  }

  /**
   * Initialize scraper with browser page.
   */
  private async initializeScraper(): Promise<void> {
    if (this.judgesScraper) return;

    const browser = this.orchestrator.getBrowser();
    const rateLimiter = this.orchestrator.getRateLimiter();
    const page = await browser.newPage();
    this.judgesScraper = new JudgesScraper(page, rateLimiter);
  }

  /**
   * Get phase name.
   */
  getPhaseName(): 'JUDGES' {
    return 'JUDGES';
  }

  /**
   * Execute the judges import phase.
   *
   * Steps:
   * 1. Scrape all judges from gomafia.pro/judges
   * 2. For each judge, find existing player by gomafiaId
   * 3. Update player with judge information
   * 4. Save checkpoint after each batch
   */
  async execute(): Promise<void> {
    console.log('[JudgesPhase] Starting judges import...');

    // Check for cancellation before starting
    this.orchestrator.checkCancellation();

    // Initialize scraper
    await this.initializeScraper();
    if (!this.judgesScraper) {
      throw new Error('Failed to initialize judges scraper');
    }

    // Track what's been updated to avoid duplicates
    const updatedJudgeIds = new Set<string>();
    let totalUpdated = 0;
    const totalSkipped = 0;
    let errorCount = 0;
    let skippedPages: number[] = [];

    // Scrape all judges with progress callback
    const result = await this.judgesScraper.scrapeAllJudges({
      skipOnError: true,
      onProgress: (pageNumber: number, currentTotal: number) => {
        // Update metrics during scraping
        this.orchestrator.updateValidationMetrics({
          totalFetched: currentTotal,
        });
      },
      onPageData: async (pageNumber: number, pageData: JudgeRawData[]) => {
        // Process each page's data as it's scraped
        for (const judgeData of pageData) {
          try {
            await this.updatePlayerWithJudgeData(judgeData);
            updatedJudgeIds.add(judgeData.gomafiaId);
            totalUpdated++;
          } catch (error) {
            console.error(
              `[JudgesPhase] Error updating judge ${judgeData.gomafiaId}:`,
              error
            );
            errorCount++;
          }
        }
        console.log(
          `[JudgesPhase] Processed page ${pageNumber}: ${pageData.length} judges`
        );
      },
    });

    const rawJudges = result.data;
    skippedPages = result.skippedPages;

    // Store skipped pages in orchestrator
    if (skippedPages.length > 0) {
      this.orchestrator.recordSkippedPages('JUDGES', skippedPages);
      console.warn(
        `[JudgesPhase] Skipped pages detected: ${skippedPages.join(', ')}`
      );
    }

    // Process any remaining judges that weren't processed in onPageData
    for (const judgeData of rawJudges) {
      if (updatedJudgeIds.has(judgeData.gomafiaId)) {
        continue; // Already processed
      }

      try {
        await this.updatePlayerWithJudgeData(judgeData);
        totalUpdated++;
      } catch (error) {
        console.error(
          `[JudgesPhase] Error updating judge ${judgeData.gomafiaId}:`,
          error
        );
        errorCount++;
      }
    }

    // Attempt to retry skipped pages if reasonable number
    if (skippedPages.length > 0 && skippedPages.length <= 5) {
      console.log(
        `[JudgesPhase] Attempting to retry ${skippedPages.length} skipped pages...`
      );
      try {
        const retriedJudges = await this.judgesScraper.retrySkippedPages(
          skippedPages,
          {
            onPageData: async (
              pageNumber: number,
              pageData: JudgeRawData[]
            ) => {
              for (const judgeData of pageData) {
                try {
                  await this.updatePlayerWithJudgeData(judgeData);
                  totalUpdated++;
                } catch (error) {
                  console.error(
                    `[JudgesPhase] Error updating judge ${judgeData.gomafiaId}:`,
                    error
                  );
                  errorCount++;
                }
              }
            },
          }
        );
        console.log(
          `[JudgesPhase] Successfully retried ${retriedJudges.length} judges from skipped pages`
        );
      } catch (error) {
        console.error('[JudgesPhase] Error retrying skipped pages:', error);
      }
    }

    // Update validation metrics
    this.orchestrator.updateValidationMetrics({
      validRecords: totalUpdated,
      invalidRecords: errorCount,
    });

    console.log(
      `[JudgesPhase] Judges import complete. Updated: ${totalUpdated}, Skipped: ${totalSkipped}, Errors: ${errorCount}`
    );
  }

  /**
   * Update player with judge data.
   * Finds player by gomafiaId and updates judge-specific fields.
   */
  private async updatePlayerWithJudgeData(
    judgeData: JudgeRawData
  ): Promise<void> {
    // Find player by gomafiaId
    const player = await resilientDB.execute((db) =>
      db.player.findUnique({
        where: { gomafiaId: judgeData.gomafiaId },
      })
    );

    if (!player) {
      console.warn(
        `[JudgesPhase] Player not found for judge ${judgeData.name} (${judgeData.gomafiaId}) - skipping judge update`
      );
      return;
    }

    // Parse accreditation date
    let accreditationDate: Date | null = null;
    if (judgeData.accreditationDate) {
      accreditationDate = new Date(judgeData.accreditationDate);
      // Validate date
      if (isNaN(accreditationDate.getTime())) {
        accreditationDate = null;
      }
    }

    // Update player with judge data
    await resilientDB.execute((db) =>
      db.player.update({
        where: { id: player.id },
        data: {
          judgeCategory: judgeData.category,
          judgeCanBeGs: judgeData.canBeGs,
          judgeCanJudgeFinal: judgeData.canJudgeFinal,
          judgeMaxTablesAsGs: judgeData.maxTablesAsGs,
          judgeRating: judgeData.rating,
          judgeGamesJudged: judgeData.gamesJudged,
          judgeAccreditationDate: accreditationDate,
          judgeResponsibleFromSc: judgeData.responsibleFromSc,
          lastSyncAt: new Date(),
          syncStatus: 'SYNCED',
        },
      })
    );
  }

  /**
   * Validate judge data.
   * Basic validation to ensure required fields are present.
   */
  private async validateData(judgeData: JudgeRawData): Promise<boolean> {
    // Must have gomafiaId and name
    if (!judgeData.gomafiaId || !judgeData.name) {
      return false;
    }

    // gomafiaId must be a valid string
    if (
      typeof judgeData.gomafiaId !== 'string' ||
      judgeData.gomafiaId.trim() === ''
    ) {
      return false;
    }

    // Name must be a valid string
    if (typeof judgeData.name !== 'string' || judgeData.name.trim() === '') {
      return false;
    }

    return true;
  }
}
