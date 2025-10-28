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

    // Scrape all tournaments
    const rawTournaments = await this.tournamentsScraper.scrapeAllTournaments({
      timeFilter: 'all',
    });

    console.log(
      `[TournamentsPhase] Scraped ${rawTournaments.length} tournaments`
    );

    // Filter valid and non-duplicate tournaments
    const validTournaments: TournamentRawData[] = [];
    let invalidCount = 0;
    let duplicateCount = 0;

    for (const tournament of rawTournaments) {
      // Validate
      const isValid = await this.validateData(tournament);
      if (!isValid) {
        invalidCount++;
        continue;
      }

      // Check duplicate
      const isDuplicate = await this.checkDuplicate(tournament.gomafiaId);
      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      validTournaments.push(tournament);
    }

    console.log(
      `[TournamentsPhase] Valid: ${validTournaments.length}, Invalid: ${invalidCount}, Duplicates: ${duplicateCount}`
    );

    // Update orchestrator metrics
    this.orchestrator.updateValidationMetrics({
      totalFetched: rawTournaments.length,
      validRecords: validTournaments.length,
      invalidRecords: invalidCount,
      duplicatesSkipped: duplicateCount,
    });

    // Batch insert
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
            createdBy: 'system-import-user', // System user for imports
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
          `[TournamentsPhase] Imported batch ${batchIndex + 1}/${totalBatches}`
        );
      }
    );

    console.log('[TournamentsPhase] Tournaments import complete');
  }

  /**
   * Validate tournament data with Zod schema.
   */
  async validateData(data: TournamentRawData): Promise<boolean> {
    const result = tournamentSchema.safeParse(data);
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
