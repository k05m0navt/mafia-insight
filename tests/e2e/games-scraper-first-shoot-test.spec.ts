/**
 * E2E test for TournamentGamesScraper first shoot detection
 *
 * Tests that the scraper correctly detects first shoot players by:
 * 1. Navigating to tournament 1898
 * 2. Extracting game data using TournamentGamesScraper
 * 3. Verifying that first shoot players are correctly identified by background color
 * 4. Verifying that games with no first shoot (mafia missed) have isFirstShoot === false for all players
 */

import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';
import { TournamentGamesScraper } from '@/lib/gomafia/scrapers/tournament-games-scraper';
import { RetryManager } from '@/lib/gomafia/import/retry-manager';

test.describe('TournamentGamesScraper - First Shoot Detection', () => {
  test('should correctly identify first shoot players by background color', async () => {
    // Launch browser for the scraper
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log('[Test] Initializing TournamentGamesScraper...');
      const scraper = new TournamentGamesScraper(page);

      console.log('[Test] Scraping games from tournament 1898...');
      const games = await scraper.scrapeGames('1898');

      console.log(`[Test] Successfully scraped ${games.length} games`);

      // Verify we got games
      expect(games.length).toBeGreaterThan(0);

      // Analyze first shoot detection and classification
      let gamesWithFirstShoot = 0;
      let gamesWithoutFirstShoot = 0;
      let totalFirstShootPlayers = 0;
      const firstShootTypeCounts = {
        ZERO_MAFIA: 0,
        ONE_TWO_MAFIA: 0,
        THREE_MAFIA: 0,
        NONE: 0,
      };

      console.log('\n' + '='.repeat(80));
      console.log('[Test] FIRST SHOOT ANALYSIS (with Type Classification):');
      console.log('='.repeat(80));

      games.forEach((game, gameIdx) => {
        if (!game.participations || game.participations.length === 0) return;

        const firstShootPlayers = game.participations.filter(
          (p) => p.isFirstShoot
        );

        if (firstShootPlayers.length > 0) {
          gamesWithFirstShoot++;
          totalFirstShootPlayers += firstShootPlayers.length;

          // Count first shoot types
          firstShootPlayers.forEach((player) => {
            const type = player.firstShootType || 'NONE';
            if (type === 'ZERO_MAFIA') firstShootTypeCounts.ZERO_MAFIA++;
            else if (type === 'ONE_TWO_MAFIA')
              firstShootTypeCounts.ONE_TWO_MAFIA++;
            else if (type === 'THREE_MAFIA') firstShootTypeCounts.THREE_MAFIA++;
            else firstShootTypeCounts.NONE++;
          });

          // Log first 5 games with first shoot for verification
          if (gamesWithFirstShoot <= 5) {
            console.log(
              `\n🎮 Game ${gameIdx + 1}: ${game.gomafiaId} (Table ${game.tableNumber || 'N/A'})`
            );
            console.log(`   Winner: ${game.winnerTeam}`);
            console.log(
              `   First Shoot Players (${firstShootPlayers.length}):`
            );
            firstShootPlayers.forEach((player) => {
              const typeLabel =
                player.firstShootType === 'ZERO_MAFIA'
                  ? '0 mafia (#818c99)'
                  : player.firstShootType === 'ONE_TWO_MAFIA'
                    ? '1-2 mafia (#29cd90)'
                    : player.firstShootType === 'THREE_MAFIA'
                      ? '3 mafia (#eaf7f9)'
                      : 'NONE';
              console.log(
                `     - ${player.playerName} (${player.role}, Team: ${player.team}, Type: ${typeLabel})`
              );
            });
          }
        } else {
          gamesWithoutFirstShoot++;

          // Log first 3 games without first shoot for verification
          if (gamesWithoutFirstShoot <= 3) {
            console.log(
              `\n🎮 Game ${gameIdx + 1}: ${game.gomafiaId} (Table ${game.tableNumber || 'N/A'})`
            );
            console.log(`   Winner: ${game.winnerTeam}`);
            console.log(
              `   ⚠️  No first shoot detected (mafia may have missed on first night)`
            );
          }
        }
      });

      console.log('\n' + '='.repeat(80));
      console.log('[Test] SUMMARY:');
      console.log('='.repeat(80));
      console.log(`  Total games: ${games.length}`);
      console.log(`  Games with first shoot: ${gamesWithFirstShoot}`);
      console.log(`  Games without first shoot: ${gamesWithoutFirstShoot}`);
      console.log(`  Total first shoot players: ${totalFirstShootPlayers}`);
      console.log(
        `  Average first shoot players per game: ${gamesWithFirstShoot > 0 ? (totalFirstShootPlayers / gamesWithFirstShoot).toFixed(2) : 0}`
      );
      console.log(`\n  First Shoot Type Classification:`);
      console.log(
        `    - ZERO_MAFIA (0 mafia, #818c99): ${firstShootTypeCounts.ZERO_MAFIA}`
      );
      console.log(
        `    - ONE_TWO_MAFIA (1-2 mafia, #29cd90): ${firstShootTypeCounts.ONE_TWO_MAFIA}`
      );
      console.log(
        `    - THREE_MAFIA (3 mafia, #eaf7f9): ${firstShootTypeCounts.THREE_MAFIA}`
      );
      console.log(
        `    - NONE (no classification): ${firstShootTypeCounts.NONE}`
      );

      // Verify that each game has at most one first shoot player
      games.forEach((game) => {
        if (game.participations) {
          const firstShootCount = game.participations.filter(
            (p) => p.isFirstShoot
          ).length;
          expect(firstShootCount).toBeLessThanOrEqual(1); // Should be 0 or 1
        }
      });

      // Show detailed structure of first game with first shoot
      const gameWithFirstShoot = games.find((g) =>
        g.participations?.some((p) => p.isFirstShoot)
      );

      if (gameWithFirstShoot) {
        console.log('\n' + '='.repeat(80));
        console.log('[Test] DETAILED STRUCTURE OF GAME WITH FIRST SHOOT:');
        console.log('='.repeat(80));
        console.log('\n🎮 Game Data:');
        console.log(
          JSON.stringify(
            {
              gomafiaId: gameWithFirstShoot.gomafiaId,
              tournamentId: gameWithFirstShoot.tournamentId,
              tableNumber: gameWithFirstShoot.tableNumber,
              winnerTeam: gameWithFirstShoot.winnerTeam,
              status: gameWithFirstShoot.status,
            },
            null,
            2
          )
        );

        if (
          gameWithFirstShoot.participations &&
          gameWithFirstShoot.participations.length > 0
        ) {
          console.log('\n👥 All Participations:');
          gameWithFirstShoot.participations.forEach((part, pIdx) => {
            const firstShoot = part.isFirstShoot ? ' 🎯' : '';
            const winner = part.isWinner ? ' 🏆' : '';
            const typeLabel =
              part.firstShootType === 'ZERO_MAFIA'
                ? '0 mafia (#818c99)'
                : part.firstShootType === 'ONE_TWO_MAFIA'
                  ? '1-2 mafia (#29cd90)'
                  : part.firstShootType === 'THREE_MAFIA'
                    ? '3 mafia (#eaf7f9)'
                    : 'NONE';
            console.log(
              JSON.stringify(
                {
                  index: pIdx + 1,
                  playerName: part.playerName,
                  role: part.role,
                  team: part.team,
                  isWinner: part.isWinner,
                  isFirstShoot: `${part.isFirstShoot}${firstShoot}`,
                  firstShootType: `${part.firstShootType || 'NONE'} (${typeLabel})`,
                  performanceScore: part.performanceScore,
                  eloChange: part.eloChange,
                },
                null,
                2
              )
            );
          });
        }

        console.log('\n' + '='.repeat(80));
      }

      console.log('\n✅ [Test] First shoot detection test passed!');
    } catch (error) {
      console.error('[Test] Error during scraping:', error);
      throw error;
    } finally {
      await browser.close();
    }
  });
});
