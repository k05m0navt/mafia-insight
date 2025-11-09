import { Page, type Request } from 'playwright';
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
    this.retryManager = retryManager || new RetryManager(5);
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
    // Wrap in retry manager to handle timeout errors
    await this.retryManager.execute(async () => {
      await this.page.goto(`https://gomafia.pro/stats/${gomafiaId}`, {
        waitUntil: 'load', // Waits for HTML/CSS, reliable with resource blocking
        timeout: 30000,
      });
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
    // If not already on the page, navigate (with retry for timeouts)
    if (!this.page.url().includes(`/stats/${gomafiaId}`)) {
      await this.retryManager.execute(async () => {
        await this.page.goto(`https://gomafia.pro/stats/${gomafiaId}`, {
          waitUntil: 'load', // Waits for HTML/CSS, reliable with resource blocking
          timeout: 30000,
        });
      });
    }

    // Get the current stats snapshot before changing year
    // This helps us detect when stats actually change after year selection
    let previousStatsSnapshot: string | null = null;
    try {
      const totalGamesElement = await this.page.$(
        '.stats_stats__stat-main-bottom-block-left-content-amount__DN0nz'
      );
      if (totalGamesElement) {
        previousStatsSnapshot =
          (await totalGamesElement.textContent())?.trim() || null;
      }
    } catch {
      // If we can't get current stats, that's okay - we'll proceed
    }

    // Set up network request monitoring to detect API calls when year changes
    // The page likely makes an API call to fetch stats for the selected year
    let apiRequestDetected = false;
    const requestHandler = (request: Request) => {
      const url = request.url();
      // Monitor for API requests that might be related to stats loading
      // Common patterns: /api/stats, /stats/, or requests containing the player ID
      if (
        url.includes('/api/') ||
        url.includes('/stats/') ||
        (url.includes(gomafiaId) &&
          (url.includes('year') || url.includes('stats')))
      ) {
        apiRequestDetected = true;
      }
    };
    this.page.on('request', requestHandler);

    try {
      // Click year selector (custom dropdown component)
      try {
        // Step 1: Click the dropdown trigger to open it
        await this.page.click(`span.Select_select__selected-span__QTMy5`, {
          timeout: 5000,
        });

        // Step 2: Wait for dropdown to appear and the year option to be visible
        await this.page.waitForSelector(`text="${year}"`, {
          timeout: 3000,
          state: 'visible',
        });

        // Step 3: Click the specific year option
        // Reset API request flag before clicking
        apiRequestDetected = false;
        await this.page.click(`text="${year}"`, { timeout: 3000 });

        // Step 4: Wait for dropdown to close and selected year to be visible in the selector
        // This ensures the selection was processed
        await this.page.waitForFunction(
          (yearParam) => {
            const selector = document.querySelector(
              'span.Select_select__selected-span__QTMy5'
            );
            return selector?.textContent?.includes(yearParam.toString());
          },
          year,
          { timeout: 5000 }
        );
      } catch (error) {
        // Year selector might not exist or year not available
        console.warn(
          `Year ${year} selector not found for player ${gomafiaId}:`,
          error instanceof Error ? error.message : error
        );
      }

      // CRITICAL FIX: Wait for stats to actually change after year selection
      // The page uses client-side state (likely React) that updates asynchronously
      // We need to wait for the stats to stabilize and be different from previous
      const maxWaitTime = 15000; // 15 seconds max wait
      const stabilityCheckInterval = 300; // Check every 300ms
      const stabilityRequiredTime = 800; // Stats must be stable for 800ms
      const minWaitAfterApiCall = 1000; // Wait at least 1 second after API call
      const startTime = Date.now();
      let lastStatsValue: string | null = null;
      let statsStableSince: number | null = null;
      let statsStabilized = false;
      let apiCallDetected = false;

      while (Date.now() - startTime < maxWaitTime && !statsStabilized) {
        await new Promise((resolve) =>
          setTimeout(resolve, stabilityCheckInterval)
        );

        try {
          // Get the current total games value as a string to detect changes
          const totalGamesElement = await this.page.$(
            '.stats_stats__stat-main-bottom-block-left-content-amount__DN0nz'
          );

          if (totalGamesElement) {
            const currentStatsText =
              (await totalGamesElement.textContent())?.trim() || '';

            // Check if stats have changed from previous snapshot
            const statsChanged =
              previousStatsSnapshot &&
              currentStatsText !== previousStatsSnapshot;

            // If stats text has changed, reset stability timer
            if (currentStatsText !== lastStatsValue) {
              lastStatsValue = currentStatsText;
              statsStableSince = Date.now();
              // If we detected an API call, mark it
              if (apiRequestDetected) {
                apiCallDetected = true;
              }
            } else if (lastStatsValue && statsStableSince) {
              // Stats haven't changed - check if they've been stable long enough
              const stableDuration = Date.now() - statsStableSince;
              const timeSinceStart = Date.now() - startTime;

              // If we detected an API call, wait at least minWaitAfterApiCall
              const minWaitTime = apiCallDetected ? minWaitAfterApiCall : 1000;

              if (
                stableDuration >= stabilityRequiredTime &&
                timeSinceStart >= minWaitTime
              ) {
                // Verify that stats actually changed from previous (if we had previous stats)
                if (previousStatsSnapshot) {
                  if (statsChanged) {
                    // Stats changed, we're good
                    statsStabilized = true;
                    break;
                  } else if (timeSinceStart < 5000) {
                    // Stats haven't changed yet, but we haven't waited long enough
                    // Continue waiting
                    continue;
                  } else {
                    // Stats haven't changed after 5 seconds - might be same data or error
                    // Log warning but proceed
                    console.warn(
                      `Stats did not change after year selection for player ${gomafiaId}, year ${year}. ` +
                        `Previous: ${previousStatsSnapshot}, Current: ${currentStatsText}`
                    );
                    statsStabilized = true;
                    break;
                  }
                } else {
                  // No previous stats to compare, stats are stable, proceed
                  statsStabilized = true;
                  break;
                }
              }
            } else if (!lastStatsValue && currentStatsText) {
              // First time we got stats, start tracking
              lastStatsValue = currentStatsText;
              statsStableSince = Date.now();
            }
          }
        } catch {
          // Element might not exist yet, continue waiting
        }
      }

      // Additional wait for network requests to complete
      try {
        await Promise.race([
          this.page.waitForLoadState('networkidle', { timeout: 5000 }),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
      } catch {
        // Network idle might not happen, that's okay
      }

      // Final wait for stats element to ensure data is loaded
      try {
        await this.page.waitForSelector(
          '.stats_stats__stat-main-bottom-block-left-content-amount__DN0nz',
          {
            timeout: 3000,
          }
        );
      } catch {
        // Stats might not exist for this year
      }

      // Extract stats
      return await this.extractYearStats(year);
    } finally {
      // Remove request handler after we're done
      this.page.off('request', requestHandler);
    }
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
