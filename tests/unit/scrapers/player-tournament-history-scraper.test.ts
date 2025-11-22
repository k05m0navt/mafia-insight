import { describe, it, expect, beforeEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { PlayerTournamentHistoryScraper } from '@/lib/gomafia/scrapers/player-tournament-history-scraper';

describe('PlayerTournamentHistoryScraper', () => {
  let browser: Browser;
  let page: Page;
  let scraper: PlayerTournamentHistoryScraper;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    scraper = new PlayerTournamentHistoryScraper(page);
  });

  afterEach(async () => {
    await browser.close();
  });

  it('should scrape tournament history with complete data', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td>1</td>
                <td><a href="/tournament/456">Grand Tournament 2024</a></td>
                <td>2024-05-20</td>
                <td>1 место</td>
                <td>150</td>
                <td>+25</td>
                <td>50 000 ₽</td>
              </tr>
              <tr>
                <td>2</td>
                <td><a href="/tournament/457">Spring Cup</a></td>
                <td>2024-03-11</td>
                <td>Top 16</td>
                <td>75</td>
                <td>-5</td>
                <td>10 000 ₽</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const history = await scraper.extractHistoryFromPage();

    expect(history).toHaveLength(2);
    expect(history[0]).toEqual({
      tournamentId: '456',
      tournamentName: 'Grand Tournament 2024',
      placement: 1,
      ggPoints: 150,
      eloChange: 25,
      prizeMoney: 50000,
    });
    expect(history[1]).toEqual({
      tournamentId: '457',
      tournamentName: 'Spring Cup',
      placement: 16, // Extracted from "Top 16"
      ggPoints: 75,
      eloChange: -5,
      prizeMoney: 10000,
    });
  });

  it('should handle player with no tournament history', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody></tbody>
          </table>
        </body>
      </html>
    `);

    const history = await scraper.extractHistoryFromPage();

    expect(history).toEqual([]);
  }, 15000);

  it('should handle missing or null values gracefully', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td>1</td>
                <td><a href="/tournament/999">Incomplete Tournament</a></td>
                <td>2023-01-01</td>
                <td>–</td>
                <td></td>
                <td>—</td>
                <td>–</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const history = await scraper.extractHistoryFromPage();

    expect(history).toHaveLength(1);
    expect(history[0]).toEqual({
      tournamentId: '999',
      tournamentName: 'Incomplete Tournament',
      placement: null,
      ggPoints: null,
      eloChange: null,
      prizeMoney: null,
    });
  });

  it('should parse Russian currency format correctly', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td>1</td>
                <td><a href="/tournament/222">Prize Tournament</a></td>
                <td>2024-04-04</td>
                <td>3</td>
                <td>100</td>
                <td>+10</td>
                <td>100 000 ₽</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const history = await scraper.extractHistoryFromPage();

    expect(history[0].prizeMoney).toBe(100000);
  });

  it('should filter out entries without tournament ID', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td>1</td>
                <td><a href="/tournament/333">Valid Tournament</a></td>
                <td>2024-07-01</td>
                <td>1</td>
                <td>100</td>
                <td>+10</td>
                <td>5000</td>
              </tr>
              <tr>
                <td>2</td>
                <td><span>Invalid - No Link</span></td>
                <td>2024-07-15</td>
                <td>2</td>
                <td>50</td>
                <td>+5</td>
                <td>2000</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const history = await scraper.extractHistoryFromPage();

    expect(history).toHaveLength(1);
    expect(history[0].tournamentId).toBe('333');
  });
});
