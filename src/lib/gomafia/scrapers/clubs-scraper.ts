import { Page } from 'playwright';
import { RateLimiter } from '../import/rate-limiter';
import { RetryManager } from '../import/retry-manager';
import { PaginationHandler } from './pagination-handler';
import { ClubRawData } from '@/types/gomafia-entities';

/**
 * Scraper for clubs list from gomafia.pro/rating?tab=clubs endpoint.
 * Extracts club data including name, region, president, and member count.
 *
 * Features:
 * - Automatic retry on transient failures with exponential backoff
 * - Rate limiting to respect server resources
 * - Pagination handling for large datasets
 */
export class ClubsScraper {
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
   * Scrape all clubs from the rating page with pagination.
   *
   * @param options Scraping options
   * @returns Array of raw club data
   */
  async scrapeAllClubs(
    options: {
      year?: number;
      region?: string;
      maxPages?: number;
      onProgress?: (pageNumber: number, currentTotal: number) => void;
      onPageData?: (pageNumber: number, data: ClubRawData[]) => Promise<void>;
      skipOnError?: boolean;
    } = {}
  ): Promise<{ data: ClubRawData[]; skippedPages: number[] }> {
    const year = options.year || new Date().getFullYear();
    const region = options.region || 'all';
    const baseUrl = `https://gomafia.pro/rating?tab=clubs&yearClubs=${year}&regionClubs=${region}`;

    return await this.paginationHandler.scrapeAllPages<ClubRawData>({
      baseUrl,
      pageParam: 'pageClubs',
      hasNextSelector: '.pagination .next',
      maxPages: options.maxPages,
      extractDataFn: async () => this.extractClubsFromPage(),
      onProgress: options.onProgress,
      onPageData: options.onPageData,
      skipOnError: options.skipOnError ?? true, // Default to skipping errors
    });
  }

  /**
   * Retry scraping specific pages that were skipped.
   *
   * @param pageNumbers Array of page numbers to retry
   * @param options Scraping options (must match original scraping options)
   * @returns Array of scraped club data from retried pages
   */
  async retrySkippedPages(
    pageNumbers: number[],
    options: {
      year?: number;
      region?: string;
      onPageData?: (pageNumber: number, data: ClubRawData[]) => Promise<void>;
    } = {}
  ): Promise<ClubRawData[]> {
    const year = options.year || new Date().getFullYear();
    const region = options.region || 'all';
    const baseUrl = `https://gomafia.pro/rating?tab=clubs&yearClubs=${year}&regionClubs=${region}`;

    return await this.paginationHandler.retrySkippedPages<ClubRawData>(
      {
        baseUrl,
        pageParam: 'pageClubs',
        hasNextSelector: '.pagination .next',
        extractDataFn: async () => this.extractClubsFromPage(),
        onPageData: options.onPageData,
        skipOnError: true,
      },
      pageNumbers
    );
  }

  /**
   * Extract club data from current page's table.
   * Wrapped with retry logic for resilience against transient failures.
   */
  async extractClubsFromPage(): Promise<ClubRawData[]> {
    return await this.retryManager.execute(async () => {
      return await this.page.$$eval('table tbody tr', (rows) => {
        return rows.map((row) => {
          // Extract club link and ID
          const clubLink = row.querySelector(
            'a[href*="/club/"]'
          ) as HTMLAnchorElement;
          const name = clubLink?.textContent?.trim() || '';
          const gomafiaId = clubLink?.href?.split('/').pop() || '';

          // Extract region
          const regionText =
            row.querySelector('.region')?.textContent?.trim() || '';
          const region =
            regionText && regionText !== '–' && regionText !== ''
              ? regionText
              : null;

          // Extract president
          const presidentText =
            row.querySelector('.president')?.textContent?.trim() || '';
          const president =
            presidentText && presidentText !== '–' && presidentText !== ''
              ? presidentText
              : null;

          // Extract members count
          const membersText =
            row.querySelector('.members')?.textContent?.trim() || '0';
          const members = parseInt(membersText);

          return {
            gomafiaId,
            name,
            region,
            president,
            members,
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
