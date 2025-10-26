import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { PlayersScraper } from '@/lib/gomafia/scrapers/players-scraper';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';

describe('PlayersScraper', () => {
  let browser: Browser;
  let page: Page;
  let rateLimiter: RateLimiter;
  let scraper: PlayersScraper;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    rateLimiter = new RateLimiter(100); // Fast for testing
    scraper = new PlayersScraper(page, rateLimiter);
  });

  afterEach(async () => {
    await browser.close();
  });

  it('should extract player data from table row', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/player/575">Иван Иванов</a></td>
                <td class="region">Москва</td>
                <td class="club">Клуб "Мафия"</td>
                <td class="tournaments">25</td>
                <td class="gg-points">1250</td>
                <td class="elo">1450.5</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const players = await scraper.extractPlayersFromPage();

    expect(players).toHaveLength(1);
    expect(players[0]).toEqual({
      gomafiaId: '575',
      name: 'Иван Иванов',
      region: 'Москва',
      club: 'Клуб "Мафия"',
      tournaments: 25,
      ggPoints: 1250,
      elo: 1450.5,
    });
  });

  it('should handle players without club or region', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/player/100">John Doe</a></td>
                <td class="region"></td>
                <td class="club">–</td>
                <td class="tournaments">0</td>
                <td class="gg-points">0</td>
                <td class="elo">1200</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const players = await scraper.extractPlayersFromPage();

    expect(players[0]).toMatchObject({
      gomafiaId: '100',
      name: 'John Doe',
      region: null,
      club: null,
      tournaments: 0,
      ggPoints: 0,
      elo: 1200,
    });
  });

  it('should extract multiple players', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/player/1">Player 1</a></td>
                <td class="region">Москва</td>
                <td class="club">Club A</td>
                <td class="tournaments">10</td>
                <td class="gg-points">500</td>
                <td class="elo">1300</td>
              </tr>
              <tr>
                <td><a href="/player/2">Player 2</a></td>
                <td class="region">СПб</td>
                <td class="club">Club B</td>
                <td class="tournaments">20</td>
                <td class="gg-points">1000</td>
                <td class="elo">1500</td>
              </tr>
              <tr>
                <td><a href="/player/3">Player 3</a></td>
                <td class="region">Казань</td>
                <td class="club">Club C</td>
                <td class="tournaments">15</td>
                <td class="gg-points">750</td>
                <td class="elo">1400</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const players = await scraper.extractPlayersFromPage();
    expect(players).toHaveLength(3);
    expect(players[0].name).toBe('Player 1');
    expect(players[1].name).toBe('Player 2');
    expect(players[2].name).toBe('Player 3');
  });

  it('should handle empty table', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <!-- No rows -->
            </tbody>
          </table>
        </body>
      </html>
    `);

    const players = await scraper.extractPlayersFromPage();
    expect(players).toHaveLength(0);
  });

  it('should handle decimal ELO ratings', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/player/999">Pro Player</a></td>
                <td class="region">Москва</td>
                <td class="club">Top Club</td>
                <td class="tournaments">100</td>
                <td class="gg-points">5000</td>
                <td class="elo">2345.75</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const players = await scraper.extractPlayersFromPage();
    expect(players[0].elo).toBe(2345.75);
  });

  it('should handle negative GG points', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/player/200">Bad Performer</a></td>
                <td class="region">Москва</td>
                <td class="club">Club</td>
                <td class="tournaments">5</td>
                <td class="gg-points">-50</td>
                <td class="elo">1100</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const players = await scraper.extractPlayersFromPage();
    expect(players[0].ggPoints).toBe(-50);
  });
});
