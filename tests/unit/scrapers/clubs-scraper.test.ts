import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { ClubsScraper } from '@/lib/gomafia/scrapers/clubs-scraper';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';

describe('ClubsScraper', () => {
  let browser: Browser;
  let page: Page;
  let rateLimiter: RateLimiter;
  let scraper: ClubsScraper;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    rateLimiter = new RateLimiter(100);
    scraper = new ClubsScraper(page, rateLimiter);
  });

  afterEach(async () => {
    await browser.close();
  });

  it('should extract club data from table row', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/club/123">Клуб "Мафия Москва"</a></td>
                <td class="region">Москва</td>
                <td class="president">Иван Иванов</td>
                <td class="members">50</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const clubs = await scraper.extractClubsFromPage();

    expect(clubs).toHaveLength(1);
    expect(clubs[0]).toEqual({
      gomafiaId: '123',
      name: 'Клуб "Мафия Москва"',
      region: 'Москва',
      president: 'Иван Иванов',
      members: 50,
    });
  });

  it('should handle clubs without president or region', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/club/456">Simple Club</a></td>
                <td class="region"></td>
                <td class="president">–</td>
                <td class="members">0</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const clubs = await scraper.extractClubsFromPage();

    expect(clubs[0]).toMatchObject({
      gomafiaId: '456',
      name: 'Simple Club',
      region: null,
      president: null,
      members: 0,
    });
  });

  it('should extract multiple clubs', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td><a href="/club/1">Club A</a></td>
                <td class="region">Москва</td>
                <td class="president">President A</td>
                <td class="members">100</td>
              </tr>
              <tr>
                <td><a href="/club/2">Club B</a></td>
                <td class="region">СПб</td>
                <td class="president">President B</td>
                <td class="members">75</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const clubs = await scraper.extractClubsFromPage();
    expect(clubs).toHaveLength(2);
    expect(clubs[0].name).toBe('Club A');
    expect(clubs[1].name).toBe('Club B');
  });

  it('should handle empty table', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody></tbody>
          </table>
        </body>
      </html>
    `);

    const clubs = await scraper.extractClubsFromPage();
    expect(clubs).toHaveLength(0);
  });
});
