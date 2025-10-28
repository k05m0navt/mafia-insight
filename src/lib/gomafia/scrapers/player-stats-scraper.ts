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

    for (let year = currentYear; year >= 2022; year--) {
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

    // Click year selector (custom dropdown component)
    try {
      // Step 1: Click the dropdown trigger to open it
      await this.page.click(`span.Select_select__selected-span__QTMy5`, {
        timeout: 5000,
      });

      // Step 2: Wait for dropdown to appear
      await this.page.waitForSelector(`text="${year}"`, { timeout: 3000 });

      // Step 3: Click the specific year option
      await this.page.click(`text="${year}"`, { timeout: 3000 });

      // Step 4: Data refreshes immediately - no waiting needed!
      // Just a small delay to ensure DOM is stable
      await this.page.waitForTimeout(500);
    } catch {
      // Year selector might not exist or year not available
      console.warn(`Year ${year} selector not found for player ${gomafiaId}`);
    }

    // Wait for dynamic content to load after year selection
    // Data refreshes immediately, so shorter timeout is sufficient
    await Promise.race([
      this.page.waitForLoadState('networkidle', { timeout: 5000 }),
      new Promise((resolve) => setTimeout(resolve, 2000)), // Fallback
    ]);

    // Wait for stats element to ensure data is loaded
    try {
      await this.page.waitForSelector('.stats, .total-games', {
        timeout: 5000,
      });
    } catch {
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

        // Extract role statistics from the correct elements
        const roleStats = Array.from(
          document.querySelectorAll(
            '.ProfileUserCircle_profile-user-circle__num__iog1A'
          )
        );
        const civilianGames =
          roleStats
            .find(
              (el) =>
                el.parentElement?.textContent?.includes('Игр за мирного') ||
                el.parentElement?.textContent?.includes('Игры за мирного')
            )
            ?.textContent?.trim() || '0';
        const donGames =
          roleStats
            .find(
              (el) =>
                el.parentElement?.textContent?.includes('Игр за дона') ||
                el.parentElement?.textContent?.includes('Игра за дона')
            )
            ?.textContent?.trim() || '0';
        const mafiaGames =
          roleStats
            .find(
              (el) =>
                el.parentElement?.textContent?.includes('Игр за мафию') ||
                el.parentElement?.textContent?.includes('Игра за мафию')
            )
            ?.textContent?.trim() || '0';
        const sheriffGames =
          roleStats
            .find((el) =>
              el.parentElement?.textContent?.includes('Игр за шерифа')
            )
            ?.textContent?.trim() || '0';

        // Extract total games from the correct element
        const totalGamesElement = document.querySelector(
          '.stats_stats__stat-main-bottom-block-left-content-amount__DN0nz'
        );
        const totalGames = totalGamesElement?.textContent?.trim() || '0';

        // Extract ELO rating - find element containing "Общий ELO" text
        const allDivs = Array.from(document.querySelectorAll('div'));
        const eloElement = allDivs.find((div) =>
          div.textContent?.includes('Общий ELO')
        );
        const eloRating =
          eloElement?.parentElement?.textContent?.match(/(\d+\.\d+)/)?.[1] ||
          null;

        // Extract extra points - find element containing "в среднем за 10 игр" text
        const extraPointsElement = allDivs.find((div) =>
          div.textContent?.includes('в среднем за 10 игр')
        );
        const extraPoints =
          extraPointsElement?.parentElement?.textContent?.match(
            /(\d+\.\d+)\s*в среднем за 10 игр/
          )?.[1] || '0';

        return {
          year: yearParam,
          totalGames: parseNumber(totalGames),
          donGames: parseNumber(donGames),
          mafiaGames: parseNumber(mafiaGames),
          sheriffGames: parseNumber(sheriffGames),
          civilianGames: parseNumber(civilianGames),
          eloRating: eloRating ? parseNullableNumber(eloRating) : null,
          extraPoints: parseNumber(extraPoints),
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
