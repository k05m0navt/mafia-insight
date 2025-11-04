import { Page } from 'playwright';
import { RetryManager } from '../import/retry-manager';
import { GameRawData } from '../validators/game-schema';

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
    // PERFORMANCE: Use 'domcontentloaded' instead of 'load' - much faster
    // We don't need images/fonts/media to load, just DOM + CSS
    await this.page.goto(
      `https://gomafia.pro/tournament/${tournamentId}?tab=games`,
      {
        waitUntil: 'domcontentloaded', // Faster than 'load' - only waits for DOM + CSS
        timeout: 10000, // Reduced from 15s - 10s should be enough for most pages
      }
    );

    // PERFORMANCE: Check for "no games" message first (early exit)
    try {
      const noGamesMessage = await this.page
        .textContent('body')
        .catch(() => null);
      if (
        noGamesMessage?.toLowerCase().includes('игр пока нет') ||
        noGamesMessage?.toLowerCase().includes('no games yet')
      ) {
        console.log(`No games found for tournament ${tournamentId}`);
        return [];
      }
    } catch {
      // Continue if check fails
    }

    // Wait for games content to load (reduced timeout)
    try {
      await this.page.waitForSelector(
        '.games-table, .games-list, .game-card, table',
        {
          timeout: 3000, // Reduced from 10s - if games exist, they load quickly
        }
      );
    } catch {
      // No games available yet - check one more time with a more specific selector
      try {
        // Sometimes games load in a different container - check for actual game tables
        const hasGameTables = await this.page.evaluate(() => {
          const tables = document.querySelectorAll('table');
          return (
            tables.length > 0 &&
            Array.from(tables).some(
              (table) => table.querySelector('tbody')?.children.length === 10
            )
          );
        });

        if (!hasGameTables) {
          console.log(`No games found for tournament ${tournamentId}`);
          return [];
        }
      } catch {
        console.log(`No games found for tournament ${tournamentId}`);
        return [];
      }
    }

    // Extract games data
    return await this.extractGamesFromPage(tournamentId);
  }

  /**
   * Extract games data from current page.
   * Wrapped with retry logic for resilience against transient failures.
   *
   * The gomafia.pro page structure:
   * - Each table represents one game
   * - Tables have a thead with "Победа мафии/мирных" result row
   * - Tables have tbody with 10 player rows (each player has position, name, role, score)
   * - Player names appear as plain text in table cells (no links on this page)
   */
  async extractGamesFromPage(tournamentId: string): Promise<GameRawData[]> {
    return await this.retryManager.execute(async () => {
      return await this.page.evaluate((tournamentIdParam) => {
        const parseWinnerTeam = (
          text: string
        ): 'BLACK' | 'RED' | 'DRAW' | null => {
          const lower = text.toLowerCase();
          if (
            lower.includes('мафи') ||
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
        ): 'DON' | 'MAFIA' | 'SHERIFF' | 'CITIZEN' | null => {
          const lower = text.toLowerCase().trim();
          if (lower.includes('дон') || lower === 'don') return 'DON';
          if (lower.includes('маф') || lower === 'mafia' || lower === 'мафия')
            return 'MAFIA';
          if (lower.includes('шер') || lower === 'sheriff') return 'SHERIFF';
          if (lower.includes('мир') || lower === 'civilian' || lower === 'civ')
            return 'CITIZEN';
          return null;
        };

        const parseTeam = (role: string | null): 'BLACK' | 'RED' | null => {
          if (!role) return null;
          const lower = role.toLowerCase();
          if (
            lower.includes('дон') ||
            lower.includes('маф') ||
            lower === 'don' ||
            lower === 'mafia'
          ) {
            return 'BLACK';
          }
          if (
            lower.includes('шер') ||
            lower.includes('мир') ||
            lower === 'sheriff' ||
            lower === 'civilian'
          ) {
            return 'RED';
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

        const parseEloChange = (
          text: string | null | undefined
        ): number | null => {
          if (!text || text.trim() === '' || text === '–' || text === '—')
            return null;
          const cleaned = text.replace(/\s/g, '').replace(/[^\d.+-]/g, ''); // Allow + and -
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? null : parsed;
        };

        // PERFORMANCE: Define color constants outside loops to avoid redefinition
        const firstShootColors = [
          { r: 129, g: 140, b: 153, type: 'ZERO_MAFIA' as const }, // #818c99
          { r: 41, g: 205, b: 144, type: 'ONE_TWO_MAFIA' as const }, // #29cd90
          { r: 234, g: 247, b: 249, type: 'THREE_MAFIA' as const }, // #eaf7f9
        ];
        const colorTolerance = 10;

        // Helper function to check if a color matches any first shoot color
        const checkColorMatch = (
          r: number,
          g: number,
          b: number
        ): 'ZERO_MAFIA' | 'ONE_TWO_MAFIA' | 'THREE_MAFIA' | null => {
          for (const targetColor of firstShootColors) {
            const rDiff = Math.abs(r - targetColor.r);
            const gDiff = Math.abs(g - targetColor.g);
            const bDiff = Math.abs(b - targetColor.b);

            if (
              rDiff <= colorTolerance &&
              gDiff <= colorTolerance &&
              bDiff <= colorTolerance
            ) {
              return targetColor.type;
            }
          }
          return null;
        };

        // Helper to extract RGB from color string
        const extractRGB = (
          colorStr: string
        ): [number, number, number] | null => {
          const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return match
            ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
            : null;
        };

        // Find all game tables on the page
        const tables = document.querySelectorAll('table');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const games: any[] = [];

        tables.forEach((table, tableIndex) => {
          // Skip if table doesn't have the expected structure (less than 2 rows in thead)
          const theadRows = table.querySelectorAll('thead tr');
          if (theadRows.length < 2) return;

          // Extract table number from the first thead row
          const firstTheadRowText = theadRows[0]?.textContent?.trim() || '';
          const tableNumberMatch = firstTheadRowText.match(/Стол\s+(\d+)/i);
          const tableNumber = tableNumberMatch
            ? parseInt(tableNumberMatch[1])
            : null;

          // Get the result row (second row in thead)
          const resultRow = theadRows[1];
          const resultText = resultRow.textContent?.trim() || '';
          const winnerTeam = parseWinnerTeam(resultText);

          // Get all player rows from tbody
          const playerRows = table.querySelectorAll('tbody tr');

          // Only process if we have player rows
          if (playerRows.length === 0) return;

          // Extract participations from player rows
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const participations: any[] = [];

          playerRows.forEach((row, _playerIndex) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 5) return; // Now expecting 5 cells: position, name, role, score, eloChange

            // PERFORMANCE: Cache textContent calls - these are expensive
            const cell1 = cells[1];
            const cell2 = cells[2];
            const cell3 = cells[3];
            const cell4 = cells[4];

            // Player position (1st cell), name (2nd cell), role (3rd cell), score (4th cell), eloChange (5th cell)
            const playerName = cell1?.textContent?.trim() || '';
            if (!playerName) return;

            const roleText = cell2?.textContent?.trim() || '';
            const performanceScoreText = cell3?.textContent?.trim() || '';
            const eloChangeText = cell4?.textContent?.trim() || '';

            const role = parseRole(roleText);
            const team = parseTeam(roleText);
            const performanceScore = parseNumber(performanceScoreText);
            const eloChange = parseEloChange(eloChangeText);

            // PERFORMANCE: Optimized first shoot detection - cache getComputedStyle and limit child traversal
            // Check for first shoot indicator by analyzing the ROLE cell color (text color first, then background)
            const roleCell = cell2;
            let isFirstShoot = false;
            let firstShootType:
              | 'NONE'
              | 'ZERO_MAFIA'
              | 'ONE_TWO_MAFIA'
              | 'THREE_MAFIA' = 'NONE';

            if (roleCell) {
              // PERFORMANCE: Cache getComputedStyle call - this is expensive
              const computedStyle = window.getComputedStyle(roleCell);

              // Check text color first (primary indicator)
              const textColor = computedStyle.color;
              const textRGB = extractRGB(textColor);
              if (textRGB) {
                const matchedType = checkColorMatch(
                  textRGB[0],
                  textRGB[1],
                  textRGB[2]
                );
                if (matchedType) {
                  isFirstShoot = true;
                  firstShootType = matchedType;
                }
              }

              // Only check background if text color didn't match
              if (!isFirstShoot) {
                const bgColor = computedStyle.backgroundColor;
                const bgRGB = extractRGB(bgColor);
                if (bgRGB) {
                  const matchedType = checkColorMatch(
                    bgRGB[0],
                    bgRGB[1],
                    bgRGB[2]
                  );
                  if (matchedType) {
                    isFirstShoot = true;
                    firstShootType = matchedType;
                  }
                }
              }

              // PERFORMANCE: Only check child elements if parent didn't match, and limit to first 3 children
              // Most first shoot indicators are on the cell itself, not children
              if (!isFirstShoot) {
                const children = roleCell.children;
                const maxChildrenToCheck = Math.min(3, children.length); // Limit to first 3 children

                for (let i = 0; i < maxChildrenToCheck; i++) {
                  const child = children[i];
                  const childStyle = window.getComputedStyle(child);

                  // Check child text color
                  const childTextRGB = extractRGB(childStyle.color);
                  if (childTextRGB) {
                    const matchedType = checkColorMatch(
                      childTextRGB[0],
                      childTextRGB[1],
                      childTextRGB[2]
                    );
                    if (matchedType) {
                      isFirstShoot = true;
                      firstShootType = matchedType;
                      break;
                    }
                  }

                  // Check child background color
                  const childBgRGB = extractRGB(childStyle.backgroundColor);
                  if (childBgRGB) {
                    const matchedType = checkColorMatch(
                      childBgRGB[0],
                      childBgRGB[1],
                      childBgRGB[2]
                    );
                    if (matchedType) {
                      isFirstShoot = true;
                      firstShootType = matchedType;
                      break;
                    }
                  }
                }
              }
            }

            // Determine if player is winner based on team and winnerTeam
            let isWinner = false;
            if (winnerTeam && team) {
              if (winnerTeam === 'DRAW') {
                // In a draw, no one wins
                isWinner = false;
              } else if (winnerTeam === 'BLACK' && team === 'BLACK') {
                isWinner = true;
              } else if (winnerTeam === 'RED' && team === 'RED') {
                isWinner = true;
              }
            }

            // Note: We don't have playerId from the links on this page
            // We'll need to match by name later in the GamesPhase
            participations.push({
              playerId: '', // Will be resolved by name matching in GamesPhase
              playerName,
              role,
              team,
              isWinner,
              performanceScore,
              eloChange,
              isFirstShoot,
              firstShootType: isFirstShoot ? firstShootType : 'NONE',
            });
          });

          // Only process if we have participations
          if (participations.length === 0) return;

          // CRITICAL: Only add game if at least some participations have valid role/team
          // This prevents adding games from participant lists (which don't have role/team info)
          const validParticipations = participations.filter(
            (p) => p.role && p.team
          );
          if (validParticipations.length === 0) {
            // Skip this table - it's likely a participant list, not a game table
            return;
          }

          // Generate unique game ID based on tournament and table index
          const gomafiaId = `${tournamentIdParam}_game_${tableIndex + 1}`;

          // Use current date (this page doesn't show game dates)
          const date = new Date().toISOString();

          // All games shown on this tab are completed
          const status = 'COMPLETED';

          games.push({
            gomafiaId,
            tournamentId: tournamentIdParam,
            tableNumber,
            judgeId: null, // Judge name is not on this page, will be resolved later
            date,
            durationMinutes: null,
            winnerTeam,
            status,
            participations:
              validParticipations.length === participations.length
                ? participations
                : validParticipations, // Only include valid participations
          });
        });

        return games;
      }, tournamentId);
    });
  }

  /**
   * Get retry manager for advanced configuration or monitoring.
   */
  getRetryManager(): RetryManager {
    return this.retryManager;
  }
}
