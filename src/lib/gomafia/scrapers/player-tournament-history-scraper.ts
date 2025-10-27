import { Page } from 'playwright';
import { RetryManager } from '../import/retry-manager';
import { PlayerTournamentRawData } from '@/types/gomafia-entities';

/**
 * Scraper for player tournament history from gomafia.pro/stats/{id}?tab=history endpoint.
 * Extracts tournament participation details including placement, GG points, ELO change, and prize money.
 *
 * Features:
 * - Automatic retry on transient failures with exponential backoff
 * - Handles dynamic content loading
 */
export class PlayerTournamentHistoryScraper {
  private retryManager: RetryManager;

  constructor(
    private page: Page,
    retryManager?: RetryManager
  ) {
    this.retryManager = retryManager || new RetryManager(3);
  }

  /**
   * Scrape tournament history for a specific player.
   *
   * @param gomafiaId Player's gomafia ID
   * @returns Array of tournament participation records
   */
  async scrapeHistory(gomafiaId: string): Promise<PlayerTournamentRawData[]> {
    // Navigate to player stats page with history tab
    await this.page.goto(`https://gomafia.pro/stats/${gomafiaId}?tab=history`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for history content to load
    try {
      await this.page.waitForSelector(
        '.history-table, .tournament-history, table',
        {
          timeout: 10000,
        }
      );
    } catch (_error) {
      // No history available
      console.log(`No tournament history found for player ${gomafiaId}`);
      return [];
    }

    // Extract tournament history data
    return await this.extractHistoryFromPage();
  }

  /**
   * Extract tournament history data from current page.
   * Wrapped with retry logic for resilience against transient failures.
   */
  async extractHistoryFromPage(): Promise<PlayerTournamentRawData[]> {
    return await this.retryManager.execute(async () => {
      return await this.page.$$eval(
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

          const extractTournamentId = (element: Element): string | null => {
            const link = element.querySelector(
              'a[href*="/tournament/"]'
            ) as HTMLAnchorElement;
            if (!link) return null;
            const href = link.getAttribute('href') || '';
            const match = href.match(/\/tournament\/(\d+)/);
            return match ? match[1] : null;
          };

          const extractTournamentName = (element: Element): string => {
            const link = element.querySelector('a[href*="/tournament/"]');
            return link?.textContent?.trim() || '';
          };

          return rows
            .map((row) => {
              const tournamentId = extractTournamentId(row);
              const tournamentName = extractTournamentName(row);

              // Extract placement (can be like "1 место", "Top 16", or just "5")
              const placementText =
                row
                  .querySelector('.placement, .place, td:nth-child(2)')
                  ?.textContent?.trim() || '';
              const placementMatch = placementText.match(/\d+/);
              const placement = placementMatch
                ? parseInt(placementMatch[0])
                : null;

              // Extract GG points
              const ggPointsText =
                row
                  .querySelector('.gg-points, .gg, td:nth-child(3)')
                  ?.textContent?.trim() || '';
              const ggPoints = parseNumber(ggPointsText);

              // Extract ELO change (can be positive or negative)
              const eloChangeText =
                row
                  .querySelector('.elo-change, .elo, td:nth-child(4)')
                  ?.textContent?.trim() || '';
              const eloChange = parseNumber(eloChangeText);

              // Extract prize money (Russian format: "10 000 ₽")
              const prizeMoneyText =
                row
                  .querySelector('.prize-money, .prize, td:nth-child(5)')
                  ?.textContent?.trim() || '';
              const prizeMoney = parseNumber(prizeMoneyText);

              return {
                tournamentId: tournamentId || '',
                tournamentName,
                placement,
                ggPoints,
                eloChange,
                prizeMoney,
              };
            })
            .filter((item) => item.tournamentId !== ''); // Filter out entries without tournament ID
        }
      );
    });
  }

  /**
   * Get retry manager for advanced configuration or monitoring.
   */
  getRetryManager(): RetryManager {
    return this.retryManager;
  }
}
