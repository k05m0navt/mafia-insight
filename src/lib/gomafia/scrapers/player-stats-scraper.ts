import { Page } from 'playwright';
import { RetryManager } from '../import/retry-manager';
import { PlayerYearStatsRawData } from '@/types/gomafia-entities';

/**
 * Scraper for player year-specific statistics from gomafia.pro/stats/{id} endpoint.
 * Handles dynamic year selection and extracts role-based game counts.
 *
 * Features:
 * - Automatic retry on transient failures with exponential backoff
 * - Dynamic year selection with automatic data detection
 */
export class PlayerStatsScraper {
  private retryManager: RetryManager;

  constructor(
    private page: Page,
    retryManager?: RetryManager
  ) {
    this.retryManager = retryManager || new RetryManager(3);
  }

  /**
   * Scrape statistics for all years for a specific player.
   * Stops after 2 consecutive years with no data.
   *
   * @param gomafiaId Player's gomafia ID
   * @returns Array of year statistics
   */
  async scrapeAllYears(gomafiaId: string): Promise<PlayerYearStatsRawData[]> {
    const currentYear = new Date().getFullYear();
    const allStats: PlayerYearStatsRawData[] = [];
    let consecutiveEmptyYears = 0;

    // Navigate to player stats page
    await this.page.goto(`https://gomafia.pro/stats/${gomafiaId}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    for (let year = currentYear; year >= 2020; year--) {
      try {
        const stats = await this.scrapeYearStats(gomafiaId, year);

        if (stats.totalGames === 0) {
          consecutiveEmptyYears++;

          // Stop if 2 consecutive years with no data
          if (consecutiveEmptyYears >= 2) {
            console.log(
              `Stopping year iteration for player ${gomafiaId} at year ${year} (2 consecutive empty years)`
            );
            break;
          }
        } else {
          // Reset counter if data found
          consecutiveEmptyYears = 0;
          allStats.push(stats);
        }
      } catch (error) {
        console.error(
          `Failed to scrape year ${year} for player ${gomafiaId}:`,
          error
        );
        // Don't count errors as empty years
        continue;
      }
    }

    return allStats;
  }

  /**
   * Scrape statistics for a specific year.
   * Handles dynamic content loading.
   *
   * @param gomafiaId Player's gomafia ID
   * @param year Year to scrape
   * @returns Year statistics
   */
  async scrapeYearStats(
    gomafiaId: string,
    year: number
  ): Promise<PlayerYearStatsRawData> {
    // If not already on the page, navigate
    if (!this.page.url().includes(`/stats/${gomafiaId}`)) {
      await this.page.goto(`https://gomafia.pro/stats/${gomafiaId}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
    }

    // Click year selector
    try {
      await this.page.click(`button:has-text("${year}")`, { timeout: 5000 });
    } catch (_error) {
      // Year selector might not exist or year not available
      console.warn(`Year ${year} selector not found for player ${gomafiaId}`);
    }

    // Wait for dynamic content to load
    await Promise.race([
      this.page.waitForLoadState('networkidle', { timeout: 10000 }),
      new Promise((resolve) => setTimeout(resolve, 5000)), // Fallback
    ]);

    // Wait for stats element to ensure data is loaded
    try {
      await this.page.waitForSelector('.stats, .total-games', {
        timeout: 5000,
      });
    } catch (_error) {
      // Stats might not exist for this year
    }

    // Extract stats
    return await this.extractYearStats(year);
  }

  /**
   * Extract year statistics from current page state.
   * Wrapped with retry logic for resilience against transient failures.
   */
  async extractYearStats(year: number): Promise<PlayerYearStatsRawData> {
    return await this.retryManager.execute(async () => {
      return await this.page.evaluate((yearParam) => {
        const getText = (selector: string): string => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || '0';
        };

        const parseNumber = (text: string): number => {
          if (text === '–' || text === '' || text === '—') return 0;
          const parsed = parseFloat(text.replace(/\s/g, ''));
          return isNaN(parsed) ? 0 : parsed;
        };

        const parseNullableNumber = (text: string): number | null => {
          if (text === '–' || text === '' || text === '—') return null;
          const parsed = parseFloat(text.replace(/\s/g, ''));
          return isNaN(parsed) ? null : parsed;
        };

        return {
          year: yearParam,
          totalGames: parseNumber(getText('.total-games')),
          donGames: parseNumber(getText('.don-games')),
          mafiaGames: parseNumber(getText('.mafia-games')),
          sheriffGames: parseNumber(getText('.sheriff-games')),
          civilianGames: parseNumber(getText('.civilian-games')),
          eloRating: parseNullableNumber(getText('.elo-rating')),
          extraPoints: parseNumber(getText('.extra-points')),
        };
      }, year);
    });
  }

  /**
   * Get retry manager for advanced configuration or monitoring.
   */
  getRetryManager(): RetryManager {
    return this.retryManager;
  }
}
