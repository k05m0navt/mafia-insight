import { Page } from 'playwright';
import { RateLimiter } from '../import/rate-limiter';
import { RetryManager } from '../import/retry-manager';
import { PaginationHandler } from './pagination-handler';
import { PlayerRawData } from '@/types/gomafia-entities';

/**
 * Scraper for players list from gomafia.pro/rating endpoint.
 * Extracts player data including name, region, club, tournaments, GG points, and ELO rating.
 *
 * Features:
 * - Automatic retry on transient failures with exponential backoff
 * - Rate limiting to respect server resources
 * - Pagination handling for large datasets
 */
export class PlayersScraper {
  private paginationHandler: PaginationHandler;
  private retryManager: RetryManager;

  constructor(
    private page: Page,
    private rateLimiter: RateLimiter,
    retryManager?: RetryManager
  ) {
    this.paginationHandler = new PaginationHandler(page, rateLimiter);
    this.retryManager = retryManager || new RetryManager(3); // Default 3 attempts
  }

  /**
   * Scrape all players from the rating page with pagination.
   *
   * @param options Scraping options
   * @returns Array of raw player data
   *
   * @example
   * const scraper = new PlayersScraper(page, rateLimiter);
   * const players = await scraper.scrapeAllPlayers({
   *   year: 2025,
   *   region: 'all',
   *   maxPages: 10
   * });
   */
  async scrapeAllPlayers(
    options: {
      year?: number;
      region?: string;
      maxPages?: number;
    } = {}
  ): Promise<PlayerRawData[]> {
    const year = options.year || new Date().getFullYear();
    const region = options.region || 'all';
    const baseUrl = `https://gomafia.pro/rating?yearUsers=${year}&regionUsers=${region}`;

    return await this.paginationHandler.scrapeAllPages<PlayerRawData>({
      baseUrl,
      pageParam: 'pageUsers',
      hasNextSelector: '.pagination .next',
      maxPages: options.maxPages,
      extractDataFn: async (_page) => this.extractPlayersFromPage(),
    });
  }

  /**
   * Extract player data from current page's table.
   * Internal method used by pagination handler.
   * Wrapped with retry logic for resilience against transient failures.
   */
  async extractPlayersFromPage(): Promise<PlayerRawData[]> {
    return await this.retryManager.execute(async () => {
      return await this.page.$$eval('table tbody tr', (rows) => {
        return rows.map((row) => {
          // Extract player link and ID
          const playerLink = row.querySelector(
            'a[href*="/player/"]'
          ) as HTMLAnchorElement;
          const name = playerLink?.textContent?.trim() || '';
          const gomafiaId = playerLink?.href?.split('/').pop() || '';

          // Extract region (may be empty)
          const regionText =
            row.querySelector('.region')?.textContent?.trim() || '';
          const region =
            regionText && regionText !== '–' && regionText !== ''
              ? regionText
              : null;

          // Extract club (may be empty or "–")
          const clubText =
            row.querySelector('.club')?.textContent?.trim() || '';
          const club =
            clubText && clubText !== '–' && clubText !== '' ? clubText : null;

          // Extract numeric values
          const tournamentsText =
            row.querySelector('.tournaments')?.textContent?.trim() || '0';
          const tournaments = parseInt(tournamentsText);

          const ggPointsText =
            row.querySelector('.gg-points')?.textContent?.trim() || '0';
          const ggPoints = parseInt(ggPointsText);

          const eloText =
            row.querySelector('.elo')?.textContent?.trim() || '1200';
          const elo = parseFloat(eloText);

          return {
            gomafiaId,
            name,
            region,
            club,
            tournaments,
            ggPoints,
            elo,
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
