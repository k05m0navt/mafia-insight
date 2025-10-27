import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { TournamentsScraper } from '@/lib/gomafia/scrapers/tournaments-scraper';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';

describe('TournamentsScraper', () => {
  let browser: Browser;
  let page: Page;
  let rateLimiter: RateLimiter;
  let scraper: TournamentsScraper;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    rateLimiter = new RateLimiter(100);
    scraper = new TournamentsScraper(page, rateLimiter);
  });

  afterEach(async () => {
    await browser.close();
  });

  it('should extract tournament data from table row', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/tournament/123">Чемпионат Москвы 2025</a></td>
                <td class="stars">⭐⭐⭐⭐⭐</td>
                <td class="avg-elo">1850.5</td>
                <td class="fsm-rated">Да</td>
                <td class="start-date">2025-01-15</td>
                <td class="end-date">2025-01-20</td>
                <td class="status">Завершён</td>
                <td class="participants">64</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const tournaments = await scraper.extractTournamentsFromPage();

    expect(tournaments).toHaveLength(1);
    expect(tournaments[0]).toMatchObject({
      gomafiaId: '123',
      name: 'Чемпионат Москвы 2025',
      stars: 5,
      averageElo: 1850.5,
      isFsmRated: true,
      status: 'COMPLETED',
      participants: 64,
    });
  });

  it('should handle tournaments without stars or FSM rating', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/tournament/456">Casual Tournament</a></td>
                <td class="stars"></td>
                <td class="avg-elo">1400</td>
                <td class="fsm-rated">Нет</td>
                <td class="start-date">2025-02-01</td>
                <td class="end-date"></td>
                <td class="status">В процессе</td>
                <td class="participants">32</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const tournaments = await scraper.extractTournamentsFromPage();

    expect(tournaments[0]).toMatchObject({
      gomafiaId: '456',
      name: 'Casual Tournament',
      stars: null,
      averageElo: 1400,
      isFsmRated: false,
      status: 'IN_PROGRESS',
      endDate: null,
    });
  });

  it('should parse different star ratings', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/tournament/1">T1</a></td>
                <td class="stars">⭐</td>
                <td class="avg-elo">1200</td>
                <td class="fsm-rated">Нет</td>
                <td class="start-date">2025-01-01</td>
                <td class="end-date">2025-01-02</td>
                <td class="status">Завершён</td>
                <td class="participants">16</td>
              </tr>
              <tr>
                <td><a href="/tournament/2">T2</a></td>
                <td class="stars">⭐⭐⭐</td>
                <td class="avg-elo">1500</td>
                <td class="fsm-rated">Да</td>
                <td class="start-date">2025-02-01</td>
                <td class="end-date">2025-02-02</td>
                <td class="status">Завершён</td>
                <td class="participants">32</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const tournaments = await scraper.extractTournamentsFromPage();
    expect(tournaments[0].stars).toBe(1);
    expect(tournaments[1].stars).toBe(3);
  });

  it('should map Russian status to enum', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/tournament/1">T1</a></td>
                <td class="stars"></td>
                <td class="avg-elo">1200</td>
                <td class="fsm-rated">Нет</td>
                <td class="start-date">2025-03-01</td>
                <td class="end-date"></td>
                <td class="status">Запланирован</td>
                <td class="participants">0</td>
              </tr>
              <tr>
                <td><a href="/tournament/2">T2</a></td>
                <td class="stars"></td>
                <td class="avg-elo">1300</td>
                <td class="fsm-rated">Нет</td>
                <td class="start-date">2025-03-05</td>
                <td class="end-date"></td>
                <td class="status">Отменён</td>
                <td class="participants">0</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const tournaments = await scraper.extractTournamentsFromPage();
    expect(tournaments[0].status).toBe('SCHEDULED');
    expect(tournaments[1].status).toBe('CANCELLED');
  });
});
