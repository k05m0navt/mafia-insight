import { Page } from 'playwright';
import { RateLimiter } from '../import/rate-limiter';
import { RetryManager } from '../import/retry-manager';

/**
 * Raw data structure for tournament Chief Judge from the detail page
 */
export interface TournamentChiefJudgeRawData {
  gomafiaId: string;
  name: string;
}

/**
 * Scraper for tournament detail pages from gomafia.pro/tournament/{id} endpoint.
 * Extracts Chief Judge information.
 *
 * Features:
 * - Automatic retry on transient failures with exponential backoff
 * - Rate limiting to respect server resources
 */
export class TournamentDetailScraper {
  private retryManager: RetryManager;

  constructor(
    private page: Page,
    private rateLimiter: RateLimiter,
    retryManager?: RetryManager
  ) {
    this.retryManager = retryManager || new RetryManager(3);
  }

  /**
   * Extract Chief Judge information from tournament detail page.
   * The Chief Judge is shown with "ГС турнира" text.
   *
   * @param tournamentGomafiaId Tournament's gomafia ID
   * @returns Chief Judge data or null if not found
   */
  async scrapeChiefJudge(
    tournamentGomafiaId: string
  ): Promise<TournamentChiefJudgeRawData | null> {
    console.log(
      `[TournamentDetailScraper] Extracting Chief Judge for tournament ID: ${tournamentGomafiaId}`
    );

    const url = `https://gomafia.pro/tournament/${tournamentGomafiaId}`;

    try {
      await this.rateLimiter.wait();

      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Extract Chief Judge from page
      const chiefJudge = await this.extractChiefJudgeFromPage();

      if (chiefJudge) {
        console.log(
          `[TournamentDetailScraper] Found Chief Judge for tournament ${tournamentGomafiaId}: ${chiefJudge.name} (${chiefJudge.gomafiaId})`
        );
      } else {
        console.log(
          `[TournamentDetailScraper] No Chief Judge found for tournament ${tournamentGomafiaId}`
        );
      }

      return chiefJudge;
    } catch (error) {
      console.error(
        `[TournamentDetailScraper] Error extracting Chief Judge for tournament ${tournamentGomafiaId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Extract Chief Judge data from current page.
   * Looks for elements containing "ГС турнира" text and finds the player link.
   */
  private async extractChiefJudgeFromPage(): Promise<TournamentChiefJudgeRawData | null> {
    return await this.retryManager.execute(async () => {
      return await this.page.evaluate(() => {
        // Method 1: Look for elements with "ГС турнира" text
        const allElements = Array.from(document.querySelectorAll('*'));
        const chiefJudgeElement = allElements.find((el) => {
          const text = el.textContent || '';
          return text.includes('ГС турнира') || text.includes('Chief Judge');
        });

        if (chiefJudgeElement) {
          // Find the link within or near this element
          const linkElement =
            chiefJudgeElement.querySelector('a[href*="/stats/"]') ||
            chiefJudgeElement.closest('a[href*="/stats/"]') ||
            chiefJudgeElement.parentElement?.querySelector(
              'a[href*="/stats/"]'
            );

          if (linkElement && linkElement instanceof HTMLAnchorElement) {
            const href =
              linkElement.getAttribute('href') || linkElement.href || '';
            const gomafiaId = href.split('/').pop() || '';
            const name = linkElement.textContent?.trim() || '';

            // Clean up name - remove "ГС турнира" text if present
            const cleanName = name
              .replace(/ГС турнира/gi, '')
              .replace(/Chief Judge/gi, '')
              .trim();

            if (gomafiaId && cleanName) {
              return {
                gomafiaId,
                name: cleanName,
              };
            }
          }
        }

        // Method 2: Try to find by looking for organizer section and checking for Chief Judge role
        const organizerSection = document.querySelector(
          '[class*="organizer"], [class*="организатор"]'
        );
        if (organizerSection) {
          const links = organizerSection.querySelectorAll('a[href*="/stats/"]');
          for (const link of Array.from(links)) {
            if (link instanceof HTMLAnchorElement) {
              const parentText = link.parentElement?.textContent || '';
              if (
                parentText.includes('ГС турнира') ||
                parentText.includes('Chief Judge')
              ) {
                const href = link.getAttribute('href') || link.href || '';
                const gomafiaId = href.split('/').pop() || '';
                const name = link.textContent?.trim() || '';

                const cleanName = name
                  .replace(/ГС турнира/gi, '')
                  .replace(/Chief Judge/gi, '')
                  .trim();

                if (gomafiaId && cleanName) {
                  return {
                    gomafiaId,
                    name: cleanName,
                  };
                }
              }
            }
          }
        }

        return null;
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
   * Get retry manager for advanced configuration or monitoring.
   */
  getRetryManager(): RetryManager {
    return this.retryManager;
  }
}
