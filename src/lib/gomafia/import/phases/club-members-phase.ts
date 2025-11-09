import { ImportOrchestrator } from '../import-orchestrator';
import { ImportCheckpoint } from '../checkpoint-manager';
import { ClubDetailScraper } from '../../scrapers/club-detail-scraper';
import { resilientDB } from '@/lib/db-resilient';

/**
 * Phase: Link players to clubs by scraping club detail pages
 *
 * This phase runs after CLUBS and PLAYERS phases to:
 * 1. Scrape club detail pages to get all members
 * 2. Update players with their clubId
 *
 * This ensures players are properly linked to clubs based on actual club membership data.
 */
export class ClubMembersPhase {
  private clubDetailScraper: ClubDetailScraper | null = null;

  constructor(private orchestrator: ImportOrchestrator) {}

  /**
   * Initialize scraper with browser page.
   */
  private async initializeScraper(): Promise<void> {
    if (this.clubDetailScraper) return;

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

    this.clubDetailScraper = new ClubDetailScraper(page, rateLimiter);
  }

  /**
   * Get phase name.
   */
  getPhaseName(): 'CLUB_MEMBERS' {
    return 'CLUB_MEMBERS';
  }

  /**
   * Execute the club members linking phase.
   *
   * Steps:
   * 1. Get all clubs from database
   * 2. For each club, scrape members from club detail page
   * 3. Update players with clubId based on gomafiaId match
   */
  async execute(): Promise<void> {
    console.log('[ClubMembersPhase] Starting club members linking...');

    // Initialize scraper
    await this.initializeScraper();
    if (!this.clubDetailScraper) {
      throw new Error('Failed to initialize club detail scraper');
    }

    // Get all clubs from database
    const clubs = (await resilientDB.execute((db) =>
      db.club.findMany({
        select: { id: true, gomafiaId: true, name: true },
      })
    )) as Array<{ id: string; gomafiaId: string | null; name: string }>;

    console.log(`[ClubMembersPhase] Found ${clubs.length} clubs to process`);

    // Filter clubs with gomafiaId
    const clubsWithGomafiaId = clubs.filter((c) => c.gomafiaId);

    if (clubsWithGomafiaId.length === 0) {
      console.log('[ClubMembersPhase] No clubs with gomafiaId found, skipping');
      return;
    }

    let totalUpdated = 0;
    let totalSkipped = 0;
    let errorCount = 0;

    // Process clubs in batches
    const batchProcessor = this.orchestrator.getBatchProcessor();

    await batchProcessor.process(
      clubsWithGomafiaId,
      async (batch, batchIndex, totalBatches) => {
        for (const club of batch as Array<{
          id: string;
          gomafiaId: string;
          name: string;
        }>) {
          try {
            console.log(
              `[ClubMembersPhase] Processing club: ${club.name} (${club.gomafiaId})`
            );

            // Scrape members and president from club detail page
            // (president is extracted on first page visit for efficiency)
            const { members, president } =
              await this.clubDetailScraper!.scrapeMembers(club.gomafiaId);

            // Update club president if found
            if (president) {
              // Find player by gomafiaId and update club's presidentId
              const presidentPlayer = await resilientDB.execute((db) =>
                db.player.findUnique({
                  where: { gomafiaId: president.gomafiaId },
                  select: { id: true },
                })
              );

              if (presidentPlayer) {
                await resilientDB.execute((db) =>
                  db.club.update({
                    where: { id: club.id },
                    data: {
                      presidentId: presidentPlayer.id,
                      lastSyncAt: new Date(),
                      syncStatus: 'SYNCED',
                    },
                  })
                );
                console.log(
                  `[ClubMembersPhase] Updated president for club ${club.name}: ${president.name}`
                );
              } else {
                console.warn(
                  `[ClubMembersPhase] President player not found in database: ${president.name} (${president.gomafiaId})`
                );
              }
            }

            if (members.length === 0) {
              console.log(
                `[ClubMembersPhase] No members found for club ${club.name}`
              );
              totalSkipped++;
              continue;
            }

            console.log(
              `[ClubMembersPhase] Found ${members.length} members for club ${club.name}`
            );

            // Get all player gomafiaIds from members
            const memberGomafiaIds = members.map((m) => m.gomafiaId);

            // Update players with clubId
            const updateResult = await resilientDB.execute((db) =>
              db.player.updateMany({
                where: {
                  gomafiaId: { in: memberGomafiaIds },
                },
                data: {
                  clubId: club.id,
                  lastSyncAt: new Date(),
                  syncStatus: 'SYNCED',
                },
              })
            );

            totalUpdated += updateResult.count;
            console.log(
              `[ClubMembersPhase] Updated ${updateResult.count} players for club ${club.name}`
            );
          } catch (error) {
            console.error(
              `[ClubMembersPhase] Error processing club ${club.name}:`,
              error
            );
            errorCount++;
            this.orchestrator.recordInvalidRecord(
              'ClubMember',
              `Failed to process club ${club.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              { clubId: club.id, clubGomafiaId: club.gomafiaId }
            );
          }
        }

        console.log(
          `[ClubMembersPhase] Processed batch ${batchIndex + 1}/${totalBatches}`
        );
      }
    );

    console.log(
      `[ClubMembersPhase] Club members linking complete. Updated: ${totalUpdated}, Skipped: ${totalSkipped}, Errors: ${errorCount}`
    );

    // Update orchestrator metrics
    this.orchestrator.updateValidationMetrics({
      totalFetched: clubsWithGomafiaId.length,
      validRecords: totalUpdated,
      invalidRecords: errorCount,
      duplicatesSkipped: totalSkipped,
    });
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
      currentPhase: 'CLUB_MEMBERS',
      currentBatch: batchIndex,
      lastProcessedId:
        processedIds.length > 0 ? processedIds[processedIds.length - 1] : null,
      processedIds,
      progress: Math.floor(((batchIndex + 1) / totalBatches) * 100),
    };
  }
}
