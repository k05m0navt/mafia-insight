/**
 * E2E test for TournamentGamesScraper draw handling
 *
 * Tests that the scraper correctly handles draw games by:
 * 1. Navigating to tournament 1894 which has a draw in Round 8, Table 1
 * 2. Extracting game data using TournamentGamesScraper
 * 3. Verifying that draw games have winnerTeam === 'DRAW'
 * 4. Verifying that all players in draw games have isWinner === false
 */

import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';
import { TournamentGamesScraper } from '@/lib/gomafia/scrapers/tournament-games-scraper';
import { RetryManager } from '@/lib/gomafia/import/retry-manager';

test.describe('TournamentGamesScraper - Draw Handling', () => {
  test('should correctly identify and handle draw games', async () => {
    // Launch browser for the scraper
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log('[Test] Initializing TournamentGamesScraper...');
      const scraper = new TournamentGamesScraper(page);

      console.log('[Test] Scraping games from tournament 1894...');
      const games = await scraper.scrapeGames('1894');

      console.log(`[Test] Successfully scraped ${games.length} games`);

      // Verify we got games
      expect(games.length).toBeGreaterThan(0);

      // Find the draw game
      const drawGame = games.find((g) => g.winnerTeam === 'DRAW');

      console.log('[Test] Looking for draw game...');

      // Verify draw game exists
      expect(drawGame).toBeDefined();
      expect(drawGame?.gomafiaId).toBeDefined();

      console.log(`[Test] Found DRAW game: ${drawGame?.gomafiaId}`);

      // Verify draw game has participations
      expect(drawGame?.participations).toBeDefined();
      expect(drawGame?.participations?.length).toBeGreaterThan(0);

      console.log(
        `[Test] Draw game has ${drawGame?.participations?.length} participations`
      );

      // Verify NO players are winners in the draw
      const winnersInDraw =
        drawGame?.participations?.filter((p) => p.isWinner).length || 0;

      console.log(`[Test] Winners in draw: ${winnersInDraw} (expected: 0)`);

      expect(winnersInDraw).toBe(0);

      // Verify game statistics
      const blackWins = games.filter((g) => g.winnerTeam === 'BLACK').length;
      const redWins = games.filter((g) => g.winnerTeam === 'RED').length;
      const draws = games.filter((g) => g.winnerTeam === 'DRAW').length;

      console.log('\n[Test] Overall statistics:');
      console.log(`  Total games: ${games.length}`);
      console.log(`  BLACK wins: ${blackWins}`);
      console.log(`  RED wins: ${redWins}`);
      console.log(`  DRAWS: ${draws}`);

      // Verify we have a reasonable distribution
      expect(blackWins + redWins + draws).toBe(games.length);
      expect(draws).toBeGreaterThan(0);

      // Display first few games for verification
      console.log('\n[Test] First 3 games:');
      games.slice(0, 3).forEach((g, idx) => {
        console.log(
          `  ${idx + 1}. ${g.gomafiaId} - Winner: ${g.winnerTeam} - Participations: ${g.participations?.length}`
        );
      });

      // Show detailed structure of first game
      if (games.length > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('[Test] DETAILED STRUCTURE OF FIRST GAME:');
        console.log('='.repeat(80));
        const firstGame = games[0];
        console.log('\n🎮 Game Data:');
        console.log(
          JSON.stringify(
            {
              gomafiaId: firstGame.gomafiaId,
              tournamentId: firstGame.tournamentId,
              date: firstGame.date,
              durationMinutes: firstGame.durationMinutes,
              winnerTeam: firstGame.winnerTeam,
              status: firstGame.status,
            },
            null,
            2
          )
        );

        if (firstGame.participations && firstGame.participations.length > 0) {
          console.log('\n👥 All Participations:');
          firstGame.participations.forEach((part, pIdx) => {
            const winner = part.isWinner ? ' 🏆' : '';
            console.log(
              JSON.stringify(
                {
                  index: pIdx + 1,
                  playerName: part.playerName,
                  playerId:
                    part.playerId || '(empty - will be matched by name)',
                  role: part.role,
                  team: part.team,
                  isWinner: `${part.isWinner}${winner}`,
                  performanceScore: part.performanceScore,
                },
                null,
                2
              )
            );
          });
        }

        // Show a RED win game example
        const redWinGame = games.find((g) => g.winnerTeam === 'RED');
        if (redWinGame) {
          console.log('\n' + '='.repeat(80));
          console.log('[Test] EXAMPLE RED WIN GAME:');
          console.log('='.repeat(80));
          console.log(
            `\n🎮 Game: ${redWinGame.gomafiaId} - Winner: ${redWinGame.winnerTeam}`
          );
          if (
            redWinGame.participations &&
            redWinGame.participations.length > 0
          ) {
            const winners = redWinGame.participations.filter((p) => p.isWinner);
            const redTeam = redWinGame.participations.filter(
              (p) => p.team === 'RED'
            );
            const blackTeam = redWinGame.participations.filter(
              (p) => p.team === 'BLACK'
            );
            console.log(
              `\n   Total players: ${redWinGame.participations.length}`
            );
            console.log(`   RED team players: ${redTeam.length}`);
            console.log(`   BLACK team players: ${blackTeam.length}`);
            console.log(
              `   Winners: ${winners.length} (all should be RED team)`
            );
            console.log(
              '\n   Winners (should all have team=RED and isWinner=true):'
            );
            winners.forEach((part, pIdx) => {
              console.log(
                `      ${pIdx + 1}. ${part.playerName} - Role: ${part.role}, Team: ${part.team}, Winner: ${part.isWinner}`
              );
            });
          }
        }

        console.log('\n' + '='.repeat(80));
      }

      console.log('\n✅ [Test] All draw handling tests passed!');
    } catch (error) {
      console.error('[Test] Error during scraping:', error);
      throw error;
    } finally {
      await browser.close();
    }
  });

  test('should correctly mark winners for BLACK and RED games', async () => {
    // Launch browser for the scraper
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log('[Test] Initializing TournamentGamesScraper...');
      const scraper = new TournamentGamesScraper(page);

      console.log('[Test] Scraping games from tournament 1894...');
      const games = await scraper.scrapeGames('1894');

      // Find a BLACK win game
      const blackWinGame = games.find((g) => g.winnerTeam === 'BLACK');

      if (blackWinGame && blackWinGame.participations) {
        console.log('[Test] Testing BLACK win game...');

        // All BLACK team players should be winners
        const blackPlayers = blackWinGame.participations.filter(
          (p) => p.team === 'BLACK'
        );
        const winners = blackPlayers.filter((p) => p.isWinner);

        console.log(
          `[Test] BLACK team: ${blackPlayers.length} players, ${winners.length} winners`
        );

        // All BLACK players should be winners
        expect(winners.length).toBe(blackPlayers.length);

        // RED players should NOT be winners
        const redPlayers = blackWinGame.participations.filter(
          (p) => p.team === 'RED'
        );
        const redWinners = redPlayers.filter((p) => p.isWinner);

        console.log(
          `[Test] RED team: ${redPlayers.length} players, ${redWinners.length} winners`
        );

        expect(redWinners.length).toBe(0);
      }

      // Find a RED win game
      const redWinGame = games.find((g) => g.winnerTeam === 'RED');

      if (redWinGame && redWinGame.participations) {
        console.log('[Test] Testing RED win game...');

        // All RED team players should be winners
        const redPlayers = redWinGame.participations.filter(
          (p) => p.team === 'RED'
        );
        const winners = redPlayers.filter((p) => p.isWinner);

        console.log(
          `[Test] RED team: ${redPlayers.length} players, ${winners.length} winners`
        );

        // All RED players should be winners
        expect(winners.length).toBe(redPlayers.length);

        // BLACK players should NOT be winners
        const blackPlayers = redWinGame.participations.filter(
          (p) => p.team === 'BLACK'
        );
        const blackWinners = blackPlayers.filter((p) => p.isWinner);

        console.log(
          `[Test] BLACK team: ${blackPlayers.length} players, ${blackWinners.length} winners`
        );

        expect(blackWinners.length).toBe(0);
      }

      console.log('\n✅ [Test] All winner marking tests passed!');
    } catch (error) {
      console.error('[Test] Error during scraping:', error);
      throw error;
    } finally {
      await browser.close();
    }
  });
});
