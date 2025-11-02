import { Page } from 'playwright';
import { RetryManager } from '../import/retry-manager';
import { RateLimiter } from '../import/rate-limiter';
import { PlayerTournamentRawData } from '@/types/gomafia-entities';

/**
 * Scraper for player tournament history from gomafia.pro/stats/{id}?tab=history endpoint.
 * Extracts tournament participation details including placement, GG points, ELO change, and prize money.
 *
 * Features:
 * - Automatic retry on transient failures with exponential backoff
 * - Handles dynamic content loading
 * - Pagination support for players with many tournaments
 */
export class PlayerTournamentHistoryScraper {
  private retryManager: RetryManager;
  private rateLimiter: RateLimiter;

  constructor(
    private page: Page,
    rateLimiter?: RateLimiter,
    retryManager?: RetryManager
  ) {
    this.retryManager = retryManager || new RetryManager(3);
    // PERFORMANCE: Reduced rate limiter delay from 2000ms to 1000ms
    // This speeds up scraping while still being respectful to the server
    this.rateLimiter = rateLimiter || new RateLimiter(1000);
  }

  /**
   * Scrape tournament history for a specific player with pagination support.
   *
   * @param gomafiaId Player's gomafia ID
   * @returns Array of tournament participation records
   */
  async scrapeHistory(gomafiaId: string): Promise<PlayerTournamentRawData[]> {
    console.log(
      `[PlayerTournamentHistoryScraper] Starting to scrape tournament history for player ID: ${gomafiaId}`
    );
    const baseUrl = `https://gomafia.pro/stats/${gomafiaId}`;

    // IMPROVED APPROACH: Navigate to base page, then click tab instead of using ?tab=history URL
    // This is more reliable because:
    // 1. Base page loads more reliably
    // 2. Tab click ensures proper JavaScript execution
    // 3. Similar pattern to PlayerStatsScraper which successfully handles dynamic content

    // Custom pagination with tab activation
    const allData: PlayerTournamentRawData[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore && currentPage <= 1000) {
      try {
        const pageUrl =
          currentPage === 1
            ? baseUrl
            : `${baseUrl}?tab=history&page=${currentPage}`;

        // Navigate to page with retry logic for timeouts
        await this.retryManager.execute(async () => {
          await this.page.goto(pageUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000, // Increased to 30s for slow pages
          });
        });

        // For first page, click the "История игр" tab if we're on base page
        if (currentPage === 1 && !this.page.url().includes('tab=history')) {
          try {
            // Click the "История игр" tab
            await this.page.click('text="История игр"', { timeout: 5000 });
            // Wait a moment for tab content to load
            await this.page.waitForTimeout(500);
          } catch (_error) {
            console.warn(
              `[PlayerTournamentHistoryScraper] Failed to click history tab for player ${gomafiaId}, trying direct URL`
            );
            // Fallback: navigate directly with tab parameter (with retry)
            await this.retryManager.execute(async () => {
              await this.page.goto(`${baseUrl}?tab=history`, {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
              });
            });
          }
        }

        // Extract data from current page
        const pageData = await this.extractHistoryFromPage();

        if (pageData.length === 0) {
          // Check if there's a next page button
          const hasNextPage =
            (await this.page.$('text="»"')) !== null ||
            (await this.page.$('a:has-text("»")')) !== null ||
            (await this.page.$(`a:has-text("${currentPage + 1}")`)) !== null;

          if (!hasNextPage || currentPage >= 100) {
            hasMore = false;
          }
        } else {
          allData.push(...pageData);
          // Check for next page
          const hasNextPage =
            (await this.page.$('text="»"')) !== null ||
            (await this.page.$('a:has-text("»")')) !== null ||
            (await this.page.$(`a:has-text("${currentPage + 1}")`)) !== null;

          if (!hasNextPage) {
            hasMore = false;
          }
        }

        if (hasMore) {
          currentPage++;
          // Rate limiting between pages
          await this.rateLimiter.wait();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Check if it's a timeout error - these are often transient
        if (
          errorMessage.includes('Timeout') ||
          errorMessage.includes('timeout')
        ) {
          console.warn(
            `[PlayerTournamentHistoryScraper] Timeout on page ${currentPage} for player ${gomafiaId}. ` +
              `This may indicate a slow page or network issue. Skipping this player.`
          );
        } else {
          console.error(
            `[PlayerTournamentHistoryScraper] Error on page ${currentPage} for player ${gomafiaId}:`,
            errorMessage
          );
        }

        // Return empty array instead of failing completely
        // This allows the phase to continue processing other players
        return [];
      }
    }

    return allData;
  }

  /**
   * Extract tournament history data from current page.
   *
   * NOTE: This method does NOT wrap operations in retryManager because:
   * 1. The pagination handler already has comprehensive retry logic
   * 2. Double-retrying can cause excessive retries and confusion
   * 3. We return empty arrays on errors instead of throwing to allow graceful degradation
   */
  async extractHistoryFromPage(): Promise<PlayerTournamentRawData[]> {
    // Wait for table to load - tab content should be visible after tab click
    try {
      // Wait for the tournament history table to load
      // The table appears after tab is activated
      await this.page.waitForSelector('table tbody tr', {
        timeout: 8000, // 8 seconds - reduced since we're clicking tab directly
      });
    } catch (_error) {
      // Table might not exist if player has no tournament history
      // Verify page loaded correctly
      const url = this.page.url();

      // Check if we're on a valid player stats page (even without tournament history)
      try {
        // Check for any stats page elements to confirm page loaded
        await this.page.waitForSelector('table, .stats, [class*="stats"]', {
          timeout: 3000,
        });
        // Page loaded but no tournament table - player likely has no tournament history
        return [];
      } catch {
        // Page might not have loaded - return empty to avoid retry loop
        console.warn(
          `[PlayerTournamentHistoryScraper] Page may not have loaded correctly: ${url}`
        );
        return [];
      }
    }

    const results = await this.page.$$eval(
      'table tbody tr, .tournament-history .tournament-item',
      (rows) => {
        const parseNumber = (
          text: string | null | undefined
        ): number | null => {
          if (!text || text.trim() === '' || text === '–' || text === '—')
            return null;
          const cleaned = text.replace(/\s/g, '').replace(/[^\d.-]/g, '');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? null : parsed;
        };

        return rows
          .map((row) => {
            const cells = row.querySelectorAll('td');

            // Skip if not enough cells
            if (cells.length < 7) return null;

            const tournamentLink = cells[1].querySelector(
              'a[href*="/tournament/"]'
            ) as HTMLAnchorElement;
            const href = tournamentLink?.getAttribute('href') || '';
            const tournamentIdMatch = href.match(/\/tournament\/(\d+)/);
            const tournamentId = tournamentIdMatch
              ? tournamentIdMatch[1]
              : null;

            // Extract tournament name (without region)
            const tournamentName = tournamentLink?.textContent?.trim() || '';

            // Extract placement from 4th cell (index 3)
            const placementText = cells[3]?.textContent?.trim() || '';
            const placementMatch = placementText.match(/\d+/);
            const placement = placementMatch
              ? parseInt(placementMatch[0])
              : null;

            // Extract GG points from 5th cell (index 4)
            const ggPointsText = cells[4]?.textContent?.trim() || '';
            const ggPoints = parseNumber(ggPointsText);

            // Extract ELO change from 6th cell (index 5)
            const eloChangeText = cells[5]?.textContent?.trim() || '';
            const eloChange = parseNumber(eloChangeText);

            // Extract prize money from 7th cell (index 6)
            const prizeMoneyText = cells[6]?.textContent?.trim() || '';
            const prizeMoney = parseNumber(prizeMoneyText);

            if (!tournamentId) return null;

            return {
              tournamentId,
              tournamentName,
              placement,
              ggPoints,
              eloChange,
              prizeMoney,
            };
          })
          .filter(
            (item): item is NonNullable<typeof item> =>
              item !== null && item.tournamentId !== ''
          ); // Filter out entries without tournament ID
      }
    );

    return results;
  }

  /**
   * Get retry manager for advanced configuration or monitoring.
   */
  getRetryManager(): RetryManager {
    return this.retryManager;
  }
}
