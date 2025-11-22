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
                <td>1</td>
                <td>
                  <a href="/stats/575">Иван Иванов</a>
                  <span class="ws-nowrap">Клуб "Мафия"</span>
                </td>
                <td>25</td>
                <td>1250</td>
                <td>1450.5</td>
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
      region: null,
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
                <td>1</td>
                <td>
                  <a href="/stats/100">John Doe</a>
                  <span class="ws-nowrap"></span>
                </td>
                <td>0</td>
                <td>0</td>
                <td>1200</td>
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
                <td>1</td>
                <td>
                  <a href="/stats/1">Player 1</a>
                  <span class="ws-nowrap">Club A</span>
                </td>
                <td>10</td>
                <td>500</td>
                <td>1300</td>
              </tr>
              <tr>
                <td>2</td>
                <td>
                  <a href="/stats/2">Player 2</a>
                  <span class="ws-nowrap">Club B</span>
                </td>
                <td>20</td>
                <td>1000</td>
                <td>1500</td>
              </tr>
              <tr>
                <td>3</td>
                <td>
                  <a href="/stats/3">Player 3</a>
                  <span class="ws-nowrap">Club C</span>
                </td>
                <td>15</td>
                <td>750</td>
                <td>1400</td>
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
                <td>1</td>
                <td>
                  <a href="/stats/999">Pro Player</a>
                  <span class="ws-nowrap">Top Club</span>
                </td>
                <td>100</td>
                <td>5000</td>
                <td>2345.75</td>
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
                <td>1</td>
                <td>
                  <a href="/stats/200">Bad Performer</a>
                  <span class="ws-nowrap">Club</span>
                </td>
                <td>5</td>
                <td>-50</td>
                <td>1100</td>
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
