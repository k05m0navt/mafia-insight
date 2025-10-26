import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { TournamentGamesScraper } from '@/lib/gomafia/scrapers/tournament-games-scraper';

describe('TournamentGamesScraper', () => {
  let browser: Browser;
  let page: Page;
  let scraper: TournamentGamesScraper;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    scraper = new TournamentGamesScraper(page);
  });

  afterEach(async () => {
    await browser.close();
  });

  it('should scrape games with complete data including participations', async () => {
    await page.route('**/tournament/123?tab=games', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <div class="game-card">
                <div class="game-date">15.01.2024 18:30</div>
                <div class="winner">Mafia win</div>
                <div class="duration">45</div>
                <div class="game-status">Completed</div>
                <div class="player-row">
                  <a href="/stats/111">Player One</a>
                  <span class="role">DON</span>
                  <span class="performance">8.5</span>
                </div>
                <div class="player-row">
                  <a href="/stats/222">Player Two</a>
                  <span class="role">SHERIFF</span>
                  <span class="performance">6.0</span>
                </div>
              </div>
              <div class="game-card">
                <div class="game-date">16.01.2024 19:00</div>
                <div class="winner">Citizens win</div>
                <div class="duration">50</div>
                <div class="game-status">Completed</div>
                <div class="player-row">
                  <a href="/stats/333">Player Three</a>
                  <span class="role">MAFIA</span>
                  <span class="performance">5.5</span>
                </div>
                <div class="player-row">
                  <a href="/stats/444">Player Four</a>
                  <span class="role">CIVILIAN</span>
                  <span class="performance">7.0</span>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    });

    const games = await scraper.scrapeGames('123');

    expect(games).toHaveLength(2);

    // First game - Mafia wins
    expect(games[0].tournamentId).toBe('123');
    expect(games[0].winnerTeam).toBe('BLACK');
    expect(games[0].status).toBe('COMPLETED');
    expect(games[0].durationMinutes).toBe(45);
    expect(games[0].participations).toHaveLength(2);
    expect(games[0].participations?.[0]).toMatchObject({
      playerId: '111',
      playerName: 'Player One',
      role: 'DON',
      team: 'MAFIA',
      isWinner: true,
      performanceScore: 8.5,
    });
    expect(games[0].participations?.[1]).toMatchObject({
      playerId: '222',
      playerName: 'Player Two',
      role: 'SHERIFF',
      team: 'CITIZENS',
      isWinner: false,
      performanceScore: 6.0,
    });

    // Second game - Citizens win
    expect(games[1].winnerTeam).toBe('RED');
    expect(games[1].participations?.[0]).toMatchObject({
      playerId: '333',
      team: 'MAFIA',
      isWinner: false,
    });
    expect(games[1].participations?.[1]).toMatchObject({
      playerId: '444',
      team: 'CITIZENS',
      isWinner: true,
    });
  });

  it('should handle tournament with no games', async () => {
    await page.route('**/tournament/999?tab=games', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <table>
                <tbody></tbody>
              </table>
            </body>
          </html>
        `,
      });
    });

    const games = await scraper.scrapeGames('999');

    expect(games).toEqual([]);
  }, 15000);

  it('should parse different winner team formats', async () => {
    await page.route('**/tournament/456?tab=games', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <div class="game-card">
                <div class="winner">Black team wins</div>
                <div class="player-row">
                  <a href="/stats/111">Player1</a>
                  <span class="role">DON</span>
                </div>
              </div>
              <div class="game-card">
                <div class="winner">Red team wins</div>
                <div class="player-row">
                  <a href="/stats/222">Player2</a>
                  <span class="role">CIVILIAN</span>
                </div>
              </div>
              <div class="game-card">
                <div class="winner">Draw</div>
                <div class="player-row">
                  <a href="/stats/333">Player3</a>
                  <span class="role">SHERIFF</span>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    });

    const games = await scraper.scrapeGames('456');

    expect(games).toHaveLength(3);
    expect(games[0].winnerTeam).toBe('BLACK');
    expect(games[1].winnerTeam).toBe('RED');
    expect(games[2].winnerTeam).toBe('DRAW');
  });

  it('should parse different role formats', async () => {
    await page.route('**/tournament/789?tab=games', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <div class="game-card">
                <div class="winner">Mafia wins</div>
                <div class="player-row">
                  <a href="/stats/111">P1</a>
                  <span class="role">DON</span>
                </div>
                <div class="player-row">
                  <a href="/stats/222">P2</a>
                  <span class="role">MAFIA</span>
                </div>
                <div class="player-row">
                  <a href="/stats/333">P3</a>
                  <span class="role">SHERIFF</span>
                </div>
                <div class="player-row">
                  <a href="/stats/444">P4</a>
                  <span class="role">CIVILIAN</span>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    });

    const games = await scraper.scrapeGames('789');

    expect(games[0].participations).toHaveLength(4);
    expect(games[0].participations?.[0].role).toBe('DON');
    expect(games[0].participations?.[1].role).toBe('MAFIA');
    expect(games[0].participations?.[2].role).toBe('SHERIFF');
    expect(games[0].participations?.[3].role).toBe('CIVILIAN');
  });

  it('should handle different game statuses', async () => {
    await page.route('**/tournament/321?tab=games', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <div class="game-card">
                <div class="game-status">Scheduled</div>
                <div class="player-row">
                  <a href="/stats/111">P1</a>
                  <span class="role">DON</span>
                </div>
              </div>
              <div class="game-card">
                <div class="game-status">In progress</div>
                <div class="player-row">
                  <a href="/stats/222">P2</a>
                  <span class="role">MAFIA</span>
                </div>
              </div>
              <div class="game-card">
                <div class="game-status">Cancelled</div>
                <div class="player-row">
                  <a href="/stats/333">P3</a>
                  <span class="role">SHERIFF</span>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    });

    const games = await scraper.scrapeGames('321');

    expect(games).toHaveLength(3);
    expect(games[0].status).toBe('SCHEDULED');
    expect(games[1].status).toBe('IN_PROGRESS');
    expect(games[2].status).toBe('CANCELLED');
  });

  it('should handle missing participation data gracefully', async () => {
    await page.route('**/tournament/654?tab=games', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <div class="game-card">
                <div class="winner">Mafia win</div>
                <div class="player-row">
                  <a href="/stats/111">Player1</a>
                  <span class="role"></span>
                  <span class="performance">–</span>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    });

    const games = await scraper.scrapeGames('654');

    expect(games[0].participations?.[0]).toMatchObject({
      playerId: '111',
      playerName: 'Player1',
      role: null,
      performanceScore: null,
    });
  });

  it('should parse Russian date format correctly', async () => {
    await page.route('**/tournament/987?tab=games', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <div class="game-card">
                <div class="game-date">25.12.2023 20:15</div>
                <div class="winner">Mafia win</div>
                <div class="player-row">
                  <a href="/stats/111">Player1</a>
                  <span class="role">DON</span>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    });

    const games = await scraper.scrapeGames('987');

    const gameDate = new Date(games[0].date);
    expect(gameDate.getUTCFullYear()).toBe(2023);
    expect(gameDate.getUTCMonth()).toBe(11); // December (0-indexed)
    expect(gameDate.getUTCDate()).toBe(25);
    expect(gameDate.getUTCHours()).toBe(20);
    expect(gameDate.getUTCMinutes()).toBe(15);
  });
});
