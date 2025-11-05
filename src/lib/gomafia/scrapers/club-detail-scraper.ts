import { Page } from 'playwright';
import { RateLimiter } from '../import/rate-limiter';
import { RetryManager } from '../import/retry-manager';
import { PaginationHandler } from './pagination-handler';

/**
 * Raw data structure for a club member from the detail page
 */
export interface ClubMemberRawData {
  gomafiaId: string;
  name: string;
}

/**
 * Raw data structure for club president from the detail page
 */
export interface ClubPresidentRawData {
  gomafiaId: string;
  name: string;
}

/**
 * Scraper for club detail pages from gomafia.pro/club/{id} endpoint.
 * Extracts club members (players) with pagination support.
 *
 * Features:
 * - Automatic retry on transient failures with exponential backoff
 * - Rate limiting to respect server resources
 * - Pagination handling for clubs with many members
 */
export class ClubDetailScraper {
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
   * Scrape all members for a specific club with pagination support.
   * Also extracts president information on the first page.
   *
   * @param clubGomafiaId Club's gomafia ID
   * @returns Object containing members array and president data
   */
  async scrapeMembersAndPresident(clubGomafiaId: string): Promise<{
    members: ClubMemberRawData[];
    president: ClubPresidentRawData | null;
  }> {
    const result = await this.scrapeMembers(clubGomafiaId);
    return result;
  }

  /**
   * Scrape all members for a specific club with pagination support.
   *
   * @param clubGomafiaId Club's gomafia ID
   * @returns Object containing members array and president data (extracted from first page)
   */
  async scrapeMembers(clubGomafiaId: string): Promise<{
    members: ClubMemberRawData[];
    president: ClubPresidentRawData | null;
  }> {
    console.log(
      `[ClubDetailScraper] Starting to scrape members for club ID: ${clubGomafiaId}`
    );
    const baseUrl = `https://gomafia.pro/club/${clubGomafiaId}`;

    // Custom pagination handling for club detail pages
    // Club pages use div-based pagination, not link-based
    const allMembers: ClubMemberRawData[] = [];
    let president: ClubPresidentRawData | null = null;
    let currentPage = 1;
    let hasMore = true;
    const maxPages = 1000; // Safety limit

    while (hasMore && currentPage <= maxPages) {
      try {
        const url =
          currentPage === 1 ? baseUrl : `${baseUrl}?page=${currentPage}`;

        await this.rateLimiter.wait();

        await this.page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // On first page, also extract president
        if (currentPage === 1) {
          president = await this.extractPresidentFromPage();
          if (president) {
            console.log(
              `[ClubDetailScraper] Found president: ${president.name} (${president.gomafiaId})`
            );
          }
        }

        // Wait for members table to load
        await this.page.waitForSelector('table tbody tr', {
          timeout: 10000,
        });

        // Extract members from current page
        const members = await this.extractMembersFromPage();
        allMembers.push(...members);

        console.log(
          `[ClubDetailScraper] Scraped page ${currentPage}: ${members.length} members (total: ${allMembers.length})`
        );

        // Check if there's a next page by looking at pagination
        hasMore = await this.page.evaluate(() => {
          const pagination = document.querySelector('[class*="pagination"]');
          if (!pagination) return false;

          // Get all page number divs
          const pageDivs = Array.from(
            pagination.querySelectorAll('[class*="page"]')
          );
          const pageNumbers = pageDivs
            .map((div) => {
              const text = div.textContent?.trim();
              const num = parseInt(text || '0');
              return isNaN(num) ? 0 : num;
            })
            .filter((n) => n > 0);

          if (pageNumbers.length === 0) return false;

          const maxPage = Math.max(...pageNumbers);
          const currentPageNum = pageDivs.findIndex((div) =>
            div.classList.toString().includes('selected')
          );

          // If current page is less than max page, there's more
          return currentPageNum >= 0 && currentPageNum < maxPage - 1;
        });

        if (!hasMore) {
          // Double-check: see if we can find a page number higher than current
          const hasHigherPage = await this.page.evaluate((pageNum) => {
            const pagination = document.querySelector('[class*="pagination"]');
            if (!pagination) return false;

            const pageDivs = Array.from(
              pagination.querySelectorAll('[class*="page"]')
            );
            const pageNumbers = pageDivs
              .map((div) => {
                const text = div.textContent?.trim();
                const num = parseInt(text || '0');
                return isNaN(num) ? 0 : num;
              })
              .filter((n) => n > 0);

            return pageNumbers.some((n) => n > pageNum);
          }, currentPage);

          hasMore = hasHigherPage;
        }

        currentPage++;
      } catch (error) {
        console.error(
          `[ClubDetailScraper] Error scraping page ${currentPage} for club ${clubGomafiaId}:`,
          error
        );
        // If we got some data, continue to next page
        if (allMembers.length > 0) {
          currentPage++;
          continue;
        }
        // Otherwise, break
        break;
      }
    }

    console.log(
      `[ClubDetailScraper] Finished scraping club ${clubGomafiaId}: ${allMembers.length} total members`
    );

    return {
      members: allMembers,
      president,
    };
  }

  /**
   * Extract member data from current page's table.
   * Table structure: | Rank | Player | Tournaments | GG Points | ELO |
   * - Player name is in <a href="/stats/ID">
   */
  private async extractMembersFromPage(): Promise<ClubMemberRawData[]> {
    return await this.retryManager.execute(async () => {
      return await this.page.$$eval('table tbody tr', (rows) => {
        return rows
          .map((row) => {
            const cells = row.querySelectorAll('td');

            // Find player link in the row (usually in second cell)
            let playerLink: HTMLAnchorElement | null = null;
            for (const cell of Array.from(cells)) {
              const link = cell.querySelector(
                'a[href*="/stats/"]'
              ) as HTMLAnchorElement;
              if (link) {
                playerLink = link;
                break;
              }
            }

            if (!playerLink) {
              return null;
            }

            const name = playerLink.textContent?.trim() || '';
            const gomafiaId = playerLink.href?.split('/').pop() || '';

            if (!gomafiaId || !name) {
              return null;
            }

            return {
              gomafiaId,
              name,
            };
          })
          .filter((member): member is ClubMemberRawData => member !== null);
      });
    });
  }

  /**
   * Get scraping metrics for monitoring.
   */
  getMetrics() {
    return {
      rateLimit: this.rateLimiter.getMetrics(),
      retry: this.retryManager.getMetrics(),
    };
  }

  /**
   * Extract president information from club detail page.
   * The president is shown in a section with "Президент клуба" text.
   *
   * @param clubGomafiaId Club's gomafia ID
   * @returns President data or null if not found
   */
  async scrapePresident(
    clubGomafiaId: string
  ): Promise<ClubPresidentRawData | null> {
    console.log(
      `[ClubDetailScraper] Extracting president for club ID: ${clubGomafiaId}`
    );

    const url = `https://gomafia.pro/club/${clubGomafiaId}`;

    try {
      await this.rateLimiter.wait();

      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Extract president from page
      const president = await this.extractPresidentFromPage();

      if (president) {
        console.log(
          `[ClubDetailScraper] Found president for club ${clubGomafiaId}: ${president.name} (${president.gomafiaId})`
        );
      } else {
        console.log(
          `[ClubDetailScraper] No president found for club ${clubGomafiaId}`
        );
      }

      return president;
    } catch (error) {
      console.error(
        `[ClubDetailScraper] Error extracting president for club ${clubGomafiaId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Extract president data from current page.
   * Looks for elements containing "Президент" text and finds the player link.
   */
  private async extractPresidentFromPage(): Promise<ClubPresidentRawData | null> {
    return await this.retryManager.execute(async () => {
      return await this.page.evaluate(() => {
        // Method 1: Look for elements with "Президент" text
        const allElements = Array.from(document.querySelectorAll('*'));
        const presidentElement = allElements.find((el) => {
          const text = el.textContent || '';
          return text.includes('Президент') || text.includes('President');
        });

        if (presidentElement) {
          // Find the link within or near this element
          const linkElement =
            presidentElement.querySelector('a[href*="/stats/"]') ||
            presidentElement.closest('a[href*="/stats/"]') ||
            presidentElement.parentElement?.querySelector('a[href*="/stats/"]');

          if (linkElement && linkElement instanceof HTMLAnchorElement) {
            const href =
              linkElement.getAttribute('href') || linkElement.href || '';
            const gomafiaId = href.split('/').pop() || '';
            const name = linkElement.textContent?.trim() || '';

            // Clean up name - remove "Президент клуба" text if present
            const cleanName = name
              .replace(/Президент клуба/gi, '')
              .replace(/President/gi, '')
              .trim();

            if (gomafiaId && cleanName) {
              return {
                gomafiaId,
                name: cleanName,
              };
            }
          }
        }

        // Method 2: Try to find by class selector
        const presidentSection = document.querySelector(
          '[class*="president"], [class*="Президент"]'
        );
        if (presidentSection) {
          const linkElement =
            presidentSection.querySelector('a[href*="/stats/"]');
          if (linkElement && linkElement instanceof HTMLAnchorElement) {
            const href =
              linkElement.getAttribute('href') || linkElement.href || '';
            const gomafiaId = href.split('/').pop() || '';
            const name = linkElement.textContent?.trim() || '';

            const cleanName = name
              .replace(/Президент клуба/gi, '')
              .replace(/President/gi, '')
              .trim();

            if (gomafiaId && cleanName) {
              return {
                gomafiaId,
                name: cleanName,
              };
            }
          }
        }

        return null;
      });
    });
  }

  /**
   * Get retry manager for advanced configuration or monitoring.
   */
  getRetryManager(): RetryManager {
    return this.retryManager;
  }
}
