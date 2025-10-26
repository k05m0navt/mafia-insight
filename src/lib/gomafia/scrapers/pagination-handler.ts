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
    let consecutiveEmptyPages = 0;
    const maxConsecutiveEmptyPages = 3;

    while (currentPage <= maxPages) {
      // Build URL with page parameter
      const url = this.buildPageUrl(
        config.baseUrl,
        config.pageParam,
        currentPage
      );

      try {
        // Navigate to page with increased timeout for high page numbers
        if (url !== 'about:blank') {
          // Skip navigation for test pages
          const timeout = currentPage > 100 ? 60000 : 30000; // 60s for high page numbers
          await this.page.goto(url, { waitUntil: 'networkidle', timeout });
        }

        // Apply rate limiting
        await this.rateLimiter.wait();

        // Extract data from current page
        const pageData = await config.extractDataFn(this.page);

        // If no data found, increment empty page counter
        if (pageData.length === 0) {
          consecutiveEmptyPages++;
          console.log(
            `[Pagination] Empty page ${currentPage} (${consecutiveEmptyPages}/${maxConsecutiveEmptyPages} consecutive)`
          );

          // If we hit too many consecutive empty pages, stop
          if (consecutiveEmptyPages >= maxConsecutiveEmptyPages) {
            console.log(
              `[Pagination] Stopping after ${consecutiveEmptyPages} consecutive empty pages`
            );
            break;
          }
        } else {
          // Reset empty page counter when we find data
          consecutiveEmptyPages = 0;
          allData.push(...pageData);
          console.log(
            `[Pagination] Page ${currentPage}: ${pageData.length} records (total: ${allData.length})`
          );
        }

        // Check for next page
        const hasNext = await this.hasNextPage(config.hasNextSelector);
        if (!hasNext) {
          console.log(
            `[Pagination] No more pages available at page ${currentPage}`
          );
          break;
        }

        currentPage++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[Pagination] Error on page ${currentPage}:`,
          errorMessage
        );

        // If it's a timeout error on a high page number, assume we've reached the end
        if (errorMessage.includes('Timeout') && currentPage > 100) {
          console.log(
            `[Pagination] Timeout on high page number ${currentPage}, assuming end of data`
          );
          break;
        }

        // For other errors, throw them
        throw error;
      }
    }

    console.log(
      `[Pagination] Scraping complete: ${allData.length} total records from ${currentPage - 1} pages`
    );
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
   * Supports both traditional "next" button and numbered pagination.
   */
  private async hasNextPage(selector: string): Promise<boolean> {
    // First try to find a traditional "next" button
    const nextButton = await this.page.$(selector);

    if (nextButton) {
      // Check if button is disabled
      const isDisabled = await nextButton.evaluate((el) =>
        el.classList.contains('disabled')
      );
      return !isDisabled;
    }

    // If no next button found, try numbered pagination
    // Look for pagination container and check if there are more pages
    const paginationInfo = await this.page.evaluate(() => {
      // Look for pagination controls
      const paginationSelectors = [
        '.pagination',
        '[class*="pagination"]',
        '[class*="Pagination"]',
      ];

      let pagination = null;
      for (const selector of paginationSelectors) {
        pagination = document.querySelector(selector);
        if (pagination) break;
      }

      if (!pagination) {
        // Look for any element containing page numbers
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          if (el.textContent?.includes('...') && el.textContent?.match(/\d+/)) {
            pagination = el;
            break;
          }
        }
      }

      if (pagination) {
        const pageNumbers = Array.from(pagination.querySelectorAll('*'))
          .map((el) => el.textContent?.trim())
          .filter((text) => text && !isNaN(Number(text)) && Number(text) > 0);

        // Safety check: if no page numbers found, assume no more pages
        if (pageNumbers.length === 0) {
          return { currentPage: 1, maxPage: 1, hasMore: false };
        }

        const maxPage = Math.max(...pageNumbers.map(Number));

        // Get current page from URL
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = parseInt(
          urlParams.get('pageClubs') ||
            urlParams.get('pageUsers') ||
            urlParams.get('page') ||
            '1'
        );

        // Safety check: if current page is already very high, be more conservative
        const hasMore = currentPage < maxPage && currentPage < 1000; // Cap at 1000 pages max

        return {
          currentPage,
          maxPage,
          hasMore,
        };
      }

      return { currentPage: 1, maxPage: 1, hasMore: false };
    });

    return paginationInfo.hasMore;
  }

  /**
   * Get pagination metrics for monitoring.
   */
  getMetrics() {
    return this.rateLimiter.getMetrics();
  }
}
