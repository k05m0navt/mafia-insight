import { Page } from 'playwright';
import { RetryManager } from '../import/retry-manager';
import {
  GameRawData,
  GameParticipationRawData,
} from '@/types/gomafia-entities';

/**
 * Scraper for tournament games from gomafia.pro/tournament/{id}?tab=games endpoint.
 * Extracts game data including participants, roles, and results.
 *
 * Features:
 * - Automatic retry on transient failures with exponential backoff
 * - Handles dynamic content loading
 */
export class TournamentGamesScraper {
  private retryManager: RetryManager;

  constructor(
    private page: Page,
    retryManager?: RetryManager
  ) {
    this.retryManager = retryManager || new RetryManager(3);
  }

  /**
   * Scrape all games for a specific tournament.
   *
   * @param tournamentId Tournament's gomafia ID
   * @returns Array of game records with participations
   */
  async scrapeGames(tournamentId: string): Promise<GameRawData[]> {
    // Navigate to tournament games page
    await this.page.goto(
      `https://gomafia.pro/tournament/${tournamentId}?tab=games`,
      {
        waitUntil: 'load', // Waits for HTML/CSS, more reliable with resource blocking
        timeout: 30000,
      }
    );

    // Wait for games content to load
    try {
      await this.page.waitForSelector(
        '.games-table, .games-list, .game-card, table',
        {
          timeout: 10000,
        }
      );
    } catch {
      // No games available yet
      console.log(`No games found for tournament ${tournamentId}`);
      return [];
    }

    // Extract games data
    return await this.extractGamesFromPage(tournamentId);
  }

  /**
   * Extract games data from current page.
   * Wrapped with retry logic for resilience against transient failures.
   */
  async extractGamesFromPage(tournamentId: string): Promise<GameRawData[]> {
    return await this.retryManager.execute(async () => {
      return await this.page.$$eval(
        '.game-card, .game-row, table tbody tr.game-row',
        (gameElements, tournamentIdParam) => {
          const parseWinnerTeam = (
            text: string
          ): 'BLACK' | 'RED' | 'DRAW' | null => {
            const lower = text.toLowerCase();
            if (
              lower.includes('мафия') ||
              lower.includes('черн') ||
              lower.includes('mafia') ||
              lower.includes('black')
            ) {
              return 'BLACK';
            }
            if (
              lower.includes('мирн') ||
              lower.includes('город') ||
              lower.includes('красн') ||
              lower.includes('citizens') ||
              lower.includes('red')
            ) {
              return 'RED';
            }
            if (lower.includes('ничья') || lower.includes('draw')) {
              return 'DRAW';
            }
            return null;
          };

          const parseRole = (
            text: string
          ): 'DON' | 'MAFIA' | 'SHERIFF' | 'CIVILIAN' | null => {
            const lower = text.toLowerCase().trim();
            if (lower.includes('дон') || lower === 'don') return 'DON';
            if (lower.includes('маф') || lower === 'mafia' || lower === 'мафия')
              return 'MAFIA';
            if (lower.includes('шер') || lower === 'sheriff') return 'SHERIFF';
            if (
              lower.includes('мир') ||
              lower === 'civilian' ||
              lower === 'civ'
            )
              return 'CIVILIAN';
            return null;
          };

          const parseTeam = (
            role: string | null
          ): 'MAFIA' | 'CITIZENS' | null => {
            if (!role) return null;
            const lower = role.toLowerCase();
            if (
              lower.includes('дон') ||
              lower.includes('маф') ||
              lower === 'don' ||
              lower === 'mafia'
            ) {
              return 'MAFIA';
            }
            if (
              lower.includes('шер') ||
              lower.includes('мир') ||
              lower === 'sheriff' ||
              lower === 'civilian'
            ) {
              return 'CITIZENS';
            }
            return null;
          };

          const parseNumber = (
            text: string | null | undefined
          ): number | null => {
            if (!text || text.trim() === '' || text === '–' || text === '—')
              return null;
            const cleaned = text.replace(/\s/g, '').replace(/[^\d.-]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? null : parsed;
          };

          const extractGameId = (element: Element): string => {
            // Try to extract game ID from element, fallback to generating one
            const link = element.querySelector(
              'a[href*="/game/"]'
            ) as HTMLAnchorElement;
            if (link) {
              const href = link.getAttribute('href') || '';
              const match = href.match(/\/game\/(\d+)/);
              if (match) return match[1];
            }

            // Generate a unique ID based on tournament and element index
            const gameNumber =
              element.getAttribute('data-game-number') ||
              element.querySelector('.game-number')?.textContent?.trim() ||
              Math.random().toString(36).substr(2, 9);
            return `${tournamentIdParam}_game_${gameNumber}`;
          };

          const extractDate = (element: Element): string => {
            const dateText =
              element
                .querySelector('.game-date, .date, td.date')
                ?.textContent?.trim() || '';
            if (dateText && dateText !== '') {
              try {
                // Try to parse Russian date format (DD.MM.YYYY HH:mm)
                const parts = dateText.match(
                  /(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/
                );
                if (parts) {
                  const [, day, month, year, hour = '12', minute = '00'] =
                    parts;
                  return new Date(
                    `${year}-${month}-${day}T${hour}:${minute}:00Z`
                  ).toISOString();
                }
              } catch {
                console.error('Failed to parse date:', dateText);
              }
            }
            // Default to current date if no date found
            return new Date().toISOString();
          };

          const extractParticipations = (
            element: Element,
            winnerTeam: 'BLACK' | 'RED' | 'DRAW' | null
          ): GameParticipationRawData[] => {
            const participations: GameParticipationRawData[] = [];
            const playerRows = element.querySelectorAll(
              '.player-row, tr.player, .participant'
            );

            playerRows.forEach((row) => {
              const playerLink = row.querySelector(
                'a[href*="/stats/"]'
              ) as HTMLAnchorElement;
              if (!playerLink) return;

              const playerId =
                playerLink.getAttribute('href')?.split('/').pop() || '';
              const playerName = playerLink.textContent?.trim() || '';

              const roleText =
                row.querySelector('.role, td.role')?.textContent?.trim() || '';
              const role = parseRole(roleText);
              const team = parseTeam(roleText);

              const performanceText =
                row
                  .querySelector('.performance, .score, td.score')
                  ?.textContent?.trim() || '';
              const performanceScore = parseNumber(performanceText);

              // Determine if player is winner based on team and winnerTeam
              let isWinner = false;
              if (winnerTeam && team) {
                if (winnerTeam === 'BLACK' && team === 'MAFIA') isWinner = true;
                if (winnerTeam === 'RED' && team === 'CITIZENS')
                  isWinner = true;
              }

              if (playerId && playerName) {
                participations.push({
                  playerId,
                  playerName,
                  role,
                  team,
                  isWinner,
                  performanceScore,
                });
              }
            });

            return participations;
          };

          return gameElements.map((gameElement) => {
            const gomafiaId = extractGameId(gameElement);
            const date = extractDate(gameElement);

            const statusText =
              gameElement
                .querySelector('.status, .game-status')
                ?.textContent?.trim()
                .toLowerCase() || '';
            let status:
              | 'SCHEDULED'
              | 'IN_PROGRESS'
              | 'COMPLETED'
              | 'CANCELLED' = 'COMPLETED';
            if (
              statusText.includes('запланирован') ||
              statusText.includes('scheduled')
            )
              status = 'SCHEDULED';
            if (
              statusText.includes('идёт') ||
              statusText.includes('идет') ||
              statusText.includes('in progress')
            )
              status = 'IN_PROGRESS';
            if (
              statusText.includes('отмен') ||
              statusText.includes('cancelled')
            )
              status = 'CANCELLED';

            const durationText =
              gameElement
                .querySelector('.duration, .game-duration')
                ?.textContent?.trim() || '';
            const durationMinutes = parseNumber(durationText);

            const winnerText =
              gameElement
                .querySelector('.winner, .result')
                ?.textContent?.trim() || '';
            const winnerTeam = parseWinnerTeam(winnerText);

            const participations = extractParticipations(
              gameElement,
              winnerTeam
            );

            return {
              gomafiaId,
              tournamentId: tournamentIdParam,
              date,
              durationMinutes,
              winnerTeam,
              status,
              participations,
            };
          });
        },
        tournamentId
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
