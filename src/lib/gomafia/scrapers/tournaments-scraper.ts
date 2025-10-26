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
   */
  async extractTournamentsFromPage(): Promise<TournamentRawData[]> {
    return await this.retryManager.execute(async () => {
      return await this.page.$$eval('table tbody tr', (rows) => {
        const parseStars = (text: string): number | null => {
          if (!text || text.trim() === '') return null;
          // Count star emoji characters
          const starCount = (text.match(/⭐/g) || []).length;
          return starCount > 0 ? starCount : null;
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
          // Extract tournament link and ID
          const tournamentLink = row.querySelector(
            'a[href*="/tournament/"]'
          ) as HTMLAnchorElement;
          const name = tournamentLink?.textContent?.trim() || '';
          const gomafiaId = tournamentLink?.href?.split('/').pop() || '';

          // Extract stars
          const starsText =
            row.querySelector('.stars')?.textContent?.trim() || '';
          const stars = parseStars(starsText);

          // Extract average ELO
          const avgEloText =
            row.querySelector('.avg-elo')?.textContent?.trim() || '';
          const averageElo =
            avgEloText && avgEloText !== '–' ? parseFloat(avgEloText) : null;

          // Extract FSM rating
          const fsmText =
            row
              .querySelector('.fsm-rated')
              ?.textContent?.trim()
              .toLowerCase() || '';
          const isFsmRated = fsmText.includes('да') || fsmText.includes('yes');

          // Extract dates
          const startDate =
            row.querySelector('.start-date')?.textContent?.trim() || '';
          const endDateText =
            row.querySelector('.end-date')?.textContent?.trim() || '';
          const endDate =
            endDateText && endDateText !== '–' && endDateText !== ''
              ? endDateText
              : null;

          // Extract status
          const statusText =
            row.querySelector('.status')?.textContent?.trim() || '';
          const status = parseStatus(statusText);

          // Extract participants
          const participantsText =
            row.querySelector('.participants')?.textContent?.trim() || '0';
          const participants = parseInt(participantsText);

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
