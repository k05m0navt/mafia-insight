import { Page } from 'playwright';
import { RateLimiter } from '../import/rate-limiter';
import { RetryManager } from '../import/retry-manager';
import { PaginationHandler } from './pagination-handler';
import { TournamentRawData } from '@/types/gomafia-entities';

/**
 * Scraper for tournaments list from gomafia.pro/tournaments endpoint.
 * Extracts tournament data including stars, average ELO, FSM rating, dates, and participant count.
 *
 * Features:
 * - Automatic retry on transient failures with exponential backoff
 * - Rate limiting to respect server resources
 * - Pagination handling for large datasets
 */
export class TournamentsScraper {
  private paginationHandler: PaginationHandler;
  private retryManager: RetryManager;

  constructor(
    private page: Page,
    private rateLimiter: RateLimiter,
    retryManager?: RetryManager
  ) {
    this.paginationHandler = new PaginationHandler(page, rateLimiter);
    this.retryManager = retryManager || new RetryManager(3);
  }

  /**
   * Scrape all tournaments with pagination.
   */
  async scrapeAllTournaments(
    options: {
      timeFilter?: 'all' | 'upcoming' | 'past';
      fsmFilter?: boolean;
      maxPages?: number;
    } = {}
  ): Promise<TournamentRawData[]> {
    const timeFilter = options.timeFilter || 'all';
    const baseUrl = `https://gomafia.pro/tournaments?time=${timeFilter}`;

    return await this.paginationHandler.scrapeAllPages<TournamentRawData>({
      baseUrl,
      pageParam: 'page',
      hasNextSelector: '.pagination .next',
      maxPages: options.maxPages,
      extractDataFn: async () => this.extractTournamentsFromPage(),
    });
  }

  /**
   * Extract tournament data from current page's table.
   * Wrapped with retry logic for resilience against transient failures.
   *
   * Table structure: | | Tournament+Location | Dates | Type | Status | |
   * - Tournament link contains <div><span with stars>RATING<b>NAME</b></span></div>
   * - Must extract name from <b> tag only to avoid including star rating number
   */
  async extractTournamentsFromPage(): Promise<TournamentRawData[]> {
    return await this.retryManager.execute(async () => {
      return await this.page.$$eval('table tbody tr', (rows) => {
        const parseStars = (starText: string): number | null => {
          if (!starText || starText.trim() === '') return null;
          // Parse the star rating number (e.g., "3", "4", "5")
          const rating = parseInt(starText.trim());
          return !isNaN(rating) && rating > 0 ? rating : null;
        };

        const parseStatus = (
          russianStatus: string
        ): 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' => {
          const status = russianStatus.toLowerCase().trim();
          if (status.includes('завершён') || status.includes('завершен'))
            return 'COMPLETED';
          if (
            status.includes('в процессе') ||
            status.includes('идёт') ||
            status.includes('идет')
          )
            return 'IN_PROGRESS';
          if (status.includes('отменён') || status.includes('отменен'))
            return 'CANCELLED';
          return 'SCHEDULED';
        };

        return rows.map((row) => {
          const cells = row.querySelectorAll('td');

          // Cell 1: Tournament name + Location
          const tournamentCell = cells[1];
          const tournamentLink = tournamentCell?.querySelector(
            'a[href*="/tournament/"]'
          ) as HTMLAnchorElement;
          const gomafiaId = tournamentLink?.href?.split('/').pop() || '';

          // Extract tournament name from <b> tag only (avoids including star rating)
          const nameElement = tournamentLink?.querySelector('b');
          const name = nameElement?.textContent?.trim() || '';

          // Extract star rating from the stars span (the text node before <b>)
          const starsSpan = tournamentLink?.querySelector(
            '.TableTournament_tournament-table__stars__zxst4, span'
          );
          const starsText = starsSpan?.textContent?.trim() || '';
          const stars = parseStars(starsText);

          // Cell 2: Dates (start and end)
          const datesCell = cells[2];
          const dateElements = datesCell?.querySelectorAll('div > div');
          const startDate = dateElements?.[0]?.textContent?.trim() || '';
          const endDateText = dateElements?.[1]?.textContent?.trim() || '';
          const endDate =
            endDateText && endDateText !== '–' && endDateText !== ''
              ? endDateText
              : null;

          // Cell 3: Tournament type (Личный/Командный)
          // Not used in current schema but available if needed

          // Cell 4: Status
          const statusCell = cells[4];
          const statusText = statusCell?.textContent?.trim() || '';
          const status = parseStatus(statusText);

          // Note: averageElo, isFsmRated, and participants are not available in this table view
          // They would need to be scraped from individual tournament pages
          const averageElo = null;
          const isFsmRated = false;
          const participants = 0;

          return {
            gomafiaId,
            name,
            stars,
            averageElo,
            isFsmRated,
            startDate,
            endDate,
            status,
            participants,
          };
        });
      });
    });
  }

  /**
   * Get scraping metrics for monitoring.
   * Includes both rate limiting and retry statistics.
   */
  getMetrics() {
    return {
      rateLimit: this.rateLimiter.getMetrics(),
      retry: this.retryManager.getMetrics(),
    };
  }

  /**
   * Get retry manager for advanced configuration or monitoring.
   */
  getRetryManager(): RetryManager {
    return this.retryManager;
  }
}
