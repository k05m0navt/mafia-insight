import { Page } from 'playwright';
import { RateLimiter } from '../import/rate-limiter';

export interface PaginationConfig<T> {
  baseUrl: string;
  pageParam: string; // e.g., 'page', 'pageUsers', 'pageClubs'
  hasNextSelector: string; // CSS selector for "next page" button
  maxPages?: number; // Optional limit for testing or safety
  extractDataFn: (page: Page) => Promise<T[]>;
  onProgress?: (pageNumber: number, currentTotal: number) => void; // Optional progress callback
  onPageData?: (pageNumber: number, data: T[]) => Promise<void>; // Optional callback for incremental saving
  skipOnError?: boolean; // If true, skip problematic pages instead of throwing
  silent?: boolean; // If true, reduce verbose logging
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
  async scrapeAllPages<T>(config: PaginationConfig<T>): Promise<{
    data: T[];
    skippedPages: number[];
  }> {
    const allData: T[] = [];
    let currentPage = 1;
    const maxPages = config.maxPages || Infinity;
    let consecutiveEmptyPages = 0;
    const maxConsecutiveEmptyPages = 3;
    const maxRetries = 5; // Increased from 3 to 5
    let retryCount = 0;
    let consecutiveTimeouts = 0;
    const maxConsecutiveTimeouts = 2; // Skip page after 2 consecutive timeouts
    const skippedPages: number[] = [];

    // Setup request failure handler for better error detection
    const failedRequests: string[] = [];
    this.page.on('requestfailed', (request) => {
      const failure = request.failure();
      if (failure?.errorText.includes('net::ERR_TIMED_OUT')) {
        failedRequests.push(request.url());
      }
    });

    while (currentPage <= maxPages) {
      // Build URL with page parameter
      const url = this.buildPageUrl(
        config.baseUrl,
        config.pageParam,
        currentPage
      );

      try {
        // Navigate to page with progressive timeout increase for high page numbers
        if (url !== 'about:blank') {
          // Skip navigation for test pages
          // PERFORMANCE OPTIMIZATION: Balanced timeouts for tab-based pages
          // Tab content loads dynamically, so we need enough time for JavaScript execution
          // Progressive timeout: 20s for page 1, 25s for pages 2-100, 30s for 101-300, 60s for 301+
          let timeout = currentPage === 1 ? 20000 : 25000; // Slightly more time for first page (tab activation)
          if (currentPage > 500) {
            timeout = 60000; // 1 minute for very high pages
          } else if (currentPage > 300) {
            timeout = 45000; // 45s
          } else if (currentPage > 100) {
            timeout = 30000; // 30s
          }

          // PERFORMANCE: Use 'domcontentloaded' - much faster than 'load'
          // Since we block images/fonts/media anyway, we only need DOM + CSS to be ready
          // The extractDataFn will wait for specific selectors anyway
          const waitUntil = 'domcontentloaded';

          await this.page.goto(url, {
            waitUntil,
            timeout,
          });
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
          retryCount = 0; // Reset retry count on successful page
          consecutiveTimeouts = 0; // Reset consecutive timeout counter
          allData.push(...pageData);

          // Only log if not silent mode
          if (!config.silent) {
            console.log(
              `[Pagination] Page ${currentPage}: ${pageData.length} records (total: ${allData.length})`
            );
          }

          // Call progress callback if provided
          if (config.onProgress) {
            config.onProgress(currentPage, allData.length);
          }

          // Call incremental save callback if provided
          if (config.onPageData) {
            try {
              await config.onPageData(currentPage, pageData);
            } catch (saveError) {
              console.error(
                `[Pagination] Error saving page ${currentPage} data:`,
                saveError
              );
              // Continue scraping even if save fails
            }
          }
        }

        // Check for next page
        const hasNext = await this.hasNextPage(config.hasNextSelector);
        if (!hasNext) {
          if (!config.silent) {
            console.log(
              `[Pagination] No more pages available at page ${currentPage}`
            );
          }
          break;
        }

        currentPage++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Retry on timeout or connection errors
        const isTimeoutError =
          errorMessage.includes('Timeout') ||
          errorMessage.includes('ERR_TIMED_OUT') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('TimeoutError');

        if (
          (isTimeoutError || errorMessage.includes('net::ERR_CONNECTION')) &&
          retryCount < maxRetries
        ) {
          retryCount++;
          // Exponential backoff with jitter: 2s, 4s, 8s, 16s, 32s
          const baseWait = Math.min(2000 * Math.pow(2, retryCount - 1), 32000);
          const jitter = Math.random() * 1000; // Add random 0-1s jitter
          const waitTime = baseWait + jitter;

          console.log(
            `[Pagination] Retry ${retryCount}/${maxRetries} for page ${currentPage} after ${Math.round(waitTime)}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue; // Retry the same page
        }

        // Handle timeout errors more gracefully
        if (isTimeoutError) {
          consecutiveTimeouts++;

          // If skipOnError is enabled and we've had multiple consecutive timeouts, skip this page
          if (
            config.skipOnError &&
            consecutiveTimeouts >= maxConsecutiveTimeouts
          ) {
            console.warn(
              `[Pagination] Skipping page ${currentPage} after ${consecutiveTimeouts} consecutive timeouts`
            );
            skippedPages.push(currentPage);
            consecutiveTimeouts = 0; // Reset for next page attempt
            retryCount = 0; // Reset retry count
            currentPage++;

            // Wait a bit before trying next page
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }

          // If it's a timeout error on a high page number after max retries, return partial data
          if (currentPage > 100) {
            console.warn(
              `[Pagination] Timeout on high page number ${currentPage} after max retries. Returning ${allData.length} records from ${currentPage - 1} pages scraped.`
            );
            if (skippedPages.length > 0) {
              console.warn(
                `[Pagination] Skipped pages: ${skippedPages.join(', ')}`
              );
            }
            // Return what we have instead of throwing
            break;
          }
        }

        // If skipOnError is enabled for non-timeout errors, skip the page
        if (config.skipOnError) {
          console.warn(
            `[Pagination] Error on page ${currentPage}, skipping: ${errorMessage}`
          );
          skippedPages.push(currentPage);
          retryCount = 0; // Reset retry count
          currentPage++;
          continue;
        }

        // For other errors or exhausted retries (and skipOnError disabled), log but return partial data
        console.error(
          `[Pagination] Error on page ${currentPage}:`,
          errorMessage
        );
        console.warn(
          `[Pagination] Returning ${allData.length} records scraped before error`
        );

        // Return partial data instead of throwing
        break;
      }
    }

    console.log(
      `[Pagination] Scraping complete: ${allData.length} total records from ${currentPage - 1} pages`
    );
    if (skippedPages.length > 0) {
      console.warn(
        `[Pagination] Skipped ${skippedPages.length} pages: ${skippedPages.join(', ')}`
      );
    }
    return { data: allData, skippedPages };
  }

  /**
   * Retry scraping specific pages that were skipped.
   * Useful for recovering from transient failures.
   *
   * @param config Pagination configuration (must match original scraping config)
   * @param pageNumbers Array of page numbers to retry
   * @returns Array of scraped data from the retried pages
   */
  async retrySkippedPages<T>(
    config: PaginationConfig<T>,
    pageNumbers: number[]
  ): Promise<T[]> {
    const retriedData: T[] = [];

    console.log(
      `[Pagination] Retrying ${pageNumbers.length} skipped pages: ${pageNumbers.join(', ')}`
    );

    for (const pageNumber of pageNumbers.sort((a, b) => a - b)) {
      const url = this.buildPageUrl(
        config.baseUrl,
        config.pageParam,
        pageNumber
      );

      try {
        // Progressive timeout based on page number
        let timeout = 30000;
        if (pageNumber > 500) {
          timeout = 120000;
        } else if (pageNumber > 300) {
          timeout = 90000;
        } else if (pageNumber > 100) {
          timeout = 60000;
        }

        const waitUntil = 'load';

        await this.page.goto(url, { waitUntil, timeout });
        await this.rateLimiter.wait();

        const pageData = await config.extractDataFn(this.page);

        if (pageData.length > 0) {
          retriedData.push(...pageData);
          console.log(
            `[Pagination] Successfully retried page ${pageNumber}: ${pageData.length} records`
          );

          // Call incremental save callback if provided
          if (config.onPageData) {
            try {
              await config.onPageData(pageNumber, pageData);
            } catch (saveError) {
              console.error(
                `[Pagination] Error saving retried page ${pageNumber} data:`,
                saveError
              );
            }
          }
        } else {
          console.warn(
            `[Pagination] Retried page ${pageNumber} but found no data`
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[Pagination] Failed to retry page ${pageNumber}: ${errorMessage}`
        );
        // Continue with other pages even if one fails
      }
    }

    console.log(
      `[Pagination] Retry complete: ${retriedData.length} records from ${pageNumbers.length} pages`
    );
    return retriedData;
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
