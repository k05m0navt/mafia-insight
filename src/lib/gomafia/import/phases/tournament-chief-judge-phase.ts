import { ImportOrchestrator } from '../import-orchestrator';
import { TournamentDetailScraper } from '../../scrapers/tournament-detail-scraper';
import { resilientDB } from '@/lib/db-resilient';

/**
 * Phase: Link Chief Judges to tournaments by scraping tournament detail pages
 *
 * This phase runs after TOURNAMENTS and PLAYERS phases to:
 * 1. Scrape tournament detail pages to get Chief Judge information
 * 2. Update tournaments with their chiefJudgeId
 *
 * This ensures tournaments are properly linked to their Chief Judges.
 */
export class TournamentChiefJudgePhase {
  private tournamentDetailScraper: TournamentDetailScraper | null = null;

  constructor(private orchestrator: ImportOrchestrator) {}

  /**
   * Initialize scraper with browser page.
   */
  private async initializeScraper(): Promise<void> {
    if (this.tournamentDetailScraper) return;

    const browser = this.orchestrator.getBrowser();
    const rateLimiter = this.orchestrator.getRateLimiter();
    const page = await browser.newPage();

    // PERFORMANCE: Block unnecessary resources to reduce page load time
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      const url = route.request().url();
      if (
        ['image', 'font', 'media', 'stylesheet'].includes(resourceType) ||
        url.includes('analytics') ||
        url.includes('google-analytics') ||
        url.includes('gtag')
      ) {
        route.abort();
      } else {
        route.continue();
      }
    });

    this.tournamentDetailScraper = new TournamentDetailScraper(
      page,
      rateLimiter
    );
  }

  /**
   * Get phase name.
   */
  getPhaseName(): 'TOURNAMENT_CHIEF_JUDGE' {
    return 'TOURNAMENT_CHIEF_JUDGE';
  }

  /**
   * Execute the tournament Chief Judge linking phase.
   *
   * Steps:
   * 1. Get all tournaments from database
   * 2. For each tournament, scrape Chief Judge from tournament detail page
   * 3. Update tournaments with chiefJudgeId based on gomafiaId match
   */
  async execute(): Promise<void> {
    console.log(
      '[TournamentChiefJudgePhase] Starting tournament Chief Judge linking...'
    );

    // Initialize scraper
    await this.initializeScraper();
    if (!this.tournamentDetailScraper) {
      throw new Error('Failed to initialize tournament detail scraper');
    }

    // Get all tournaments from database
    const tournaments = (await resilientDB.execute((db) =>
      db.tournament.findMany({
        select: { id: true, gomafiaId: true, name: true },
        where: {
          gomafiaId: { not: null },
        },
      })
    )) as Array<{ id: string; gomafiaId: string | null; name: string }>;

    console.log(
      `[TournamentChiefJudgePhase] Found ${tournaments.length} tournaments to process`
    );

    // Filter tournaments with gomafiaId
    const tournamentsWithGomafiaId = tournaments.filter((t) => t.gomafiaId);

    if (tournamentsWithGomafiaId.length === 0) {
      console.log(
        '[TournamentChiefJudgePhase] No tournaments with gomafiaId found, skipping'
      );
      return;
    }

    let totalUpdated = 0;
    let totalSkipped = 0;
    let errorCount = 0;

    // Process tournaments in batches
    const batchProcessor = this.orchestrator.getBatchProcessor();

    await batchProcessor.process(
      tournamentsWithGomafiaId,
      async (batch, batchIndex, totalBatches) => {
        for (const tournament of batch as Array<{
          id: string;
          gomafiaId: string;
          name: string;
        }>) {
          try {
            console.log(
              `[TournamentChiefJudgePhase] Processing tournament: ${tournament.name} (${tournament.gomafiaId})`
            );

            // Scrape Chief Judge from tournament detail page
            const chiefJudge =
              await this.tournamentDetailScraper!.scrapeChiefJudge(
                tournament.gomafiaId
              );

            if (!chiefJudge) {
              console.log(
                `[TournamentChiefJudgePhase] No Chief Judge found for tournament ${tournament.name}`
              );
              totalSkipped++;
              continue;
            }

            // Find player by gomafiaId and update tournament's chiefJudgeId
            const chiefJudgePlayer = await resilientDB.execute((db) =>
              db.player.findUnique({
                where: { gomafiaId: chiefJudge.gomafiaId },
                select: { id: true },
              })
            );

            if (chiefJudgePlayer) {
              await resilientDB.execute((db) =>
                db.tournament.update({
                  where: { id: tournament.id },
                  data: {
                    chiefJudgeId: chiefJudgePlayer.id,
                    lastSyncAt: new Date(),
                    syncStatus: 'SYNCED',
                  },
                })
              );
              totalUpdated++;
              console.log(
                `[TournamentChiefJudgePhase] Updated Chief Judge for tournament ${tournament.name}: ${chiefJudge.name}`
              );
            } else {
              console.warn(
                `[TournamentChiefJudgePhase] Chief Judge player not found in database: ${chiefJudge.name} (${chiefJudge.gomafiaId})`
              );
              totalSkipped++;
            }
          } catch (error) {
            console.error(
              `[TournamentChiefJudgePhase] Error processing tournament ${tournament.name}:`,
              error
            );
            errorCount++;
            this.orchestrator.recordInvalidRecord(
              'TournamentChiefJudge',
              `Failed to process tournament ${tournament.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              {
                tournamentId: tournament.id,
                tournamentGomafiaId: tournament.gomafiaId,
              }
            );
          }
        }

        console.log(
          `[TournamentChiefJudgePhase] Processed batch ${batchIndex + 1}/${totalBatches}`
        );
      }
    );

    console.log(
      `[TournamentChiefJudgePhase] Tournament Chief Judge linking complete. Updated: ${totalUpdated}, Skipped: ${totalSkipped}, Errors: ${errorCount}`
    );

    // Update orchestrator metrics
    this.orchestrator.updateValidationMetrics({
      totalFetched: tournamentsWithGomafiaId.length,
      validRecords: totalUpdated,
      invalidRecords: errorCount,
      duplicatesSkipped: totalSkipped,
    });
  }
}
