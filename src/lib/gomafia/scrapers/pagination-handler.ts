import { Page } from 'playwright';
import { RateLimiter } from '../import/rate-limiter';

export interface PaginationConfig<T> {
  baseUrl: string;
  pageParam: string; // e.g., 'page', 'pageUsers', 'pageClubs'
  hasNextSelector: string; // CSS selector for "next page" button
  maxPages?: number; // Optional limit for testing or safety
  extractDataFn: (page: Page) => Promise<T[]>;
}

/**
 * Generic pagination handler for scraping paginated content from gomafia.pro.
 * Handles URL parameter pagination with rate limiting.
 */
export class PaginationHandler {
  constructor(
    private page: Page,
    private rateLimiter: RateLimiter
  ) {}

  /**
   * Scrape all pages of paginated content.
   *
   * @param config Pagination configuration
   * @returns Flattened array of all scraped data
   *
   * @example
   * const handler = new PaginationHandler(page, rateLimiter);
   * const players = await handler.scrapeAllPages({
   *   baseUrl: 'https://gomafia.pro/rating?yearUsers=2025',
   *   pageParam: 'pageUsers',
   *   hasNextSelector: '.pagination .next',
   *   extractDataFn: async (page) => {
   *     return await page.$$eval('table tbody tr', rows =>
   *       rows.map(row => ({ name: row.querySelector('.name')?.textContent }))
   *     );
   *   }
   * });
   */
  async scrapeAllPages<T>(config: PaginationConfig<T>): Promise<T[]> {
    const allData: T[] = [];
    let currentPage = 1;
    const maxPages = config.maxPages || Infinity;

    while (currentPage <= maxPages) {
      // Build URL with page parameter
      const url = this.buildPageUrl(
        config.baseUrl,
        config.pageParam,
        currentPage
      );

      // Navigate to page
      if (url !== 'about:blank') {
        // Skip navigation for test pages
        await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      }

      // Apply rate limiting
      await this.rateLimiter.wait();

      // Extract data from current page
      const pageData = await config.extractDataFn(this.page);

      // If no data found, assume we've reached the end
      if (pageData.length === 0) {
        break;
      }

      allData.push(...pageData);

      // Check for next page
      const hasNext = await this.hasNextPage(config.hasNextSelector);
      if (!hasNext) {
        break;
      }

      currentPage++;
    }

    return allData;
  }

  /**
   * Build URL with page parameter.
   * Handles both cases: URL with existing query params and without.
   */
  buildPageUrl(baseUrl: string, pageParam: string, pageNumber: number): string {
    if (baseUrl === 'about:blank') {
      return baseUrl; // Special case for tests
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${pageParam}=${pageNumber}`;
  }

  /**
   * Check if there's a next page available.
   * Returns false if next button doesn't exist or is disabled.
   */
  private async hasNextPage(selector: string): Promise<boolean> {
    const nextButton = await this.page.$(selector);

    if (!nextButton) {
      return false;
    }

    // Check if button is disabled
    const isDisabled = await nextButton.evaluate((el) =>
      el.classList.contains('disabled')
    );

    return !isDisabled;
  }

  /**
   * Get pagination metrics for monitoring.
   */
  getMetrics() {
    return this.rateLimiter.getMetrics();
  }
}
