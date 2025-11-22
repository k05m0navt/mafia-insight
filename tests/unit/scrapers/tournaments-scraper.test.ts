import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import type { Page } from 'playwright';
import { TournamentsScraper } from '@/lib/gomafia/scrapers/tournaments-scraper';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';

class MockTablePage {
  private html = '';

  async setContent(html: string) {
    this.html = html;
  }

  async $$eval<R>(selector: string, callback: (elements: Element[]) => R) {
    const dom = new JSDOM(this.html);
    const elements = Array.from(dom.window.document.querySelectorAll(selector));
    return callback(elements);
  }
}

describe('TournamentsScraper', () => {
  const rateLimiter = new RateLimiter(100);

  it('extracts tournament data from table row', async () => {
    const page = new MockTablePage();
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td>1</td>
                <td>
                  <a href="/tournament/123">
                    18505 <b>Чемпионат Москвы 2025</b>
                  </a>
                </td>
                <td class="dates">15.01.2025 20.01.2025</td>
                <td class="type">Личный</td>
                <td class="status">Завершён</td>
                <td class="participants">64</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const scraper = new TournamentsScraper(
      page as unknown as Page,
      rateLimiter
    );
    const tournaments = await scraper.extractTournamentsFromPage();

    expect(tournaments).toHaveLength(1);
    expect(tournaments[0]).toMatchObject({
      gomafiaId: '123',
      name: 'Чемпионат Москвы 2025',
      stars: 5,
      averageElo: 1850,
      isFsmRated: false,
      status: 'COMPLETED',
      participants: 0,
    });
  });

  it('handles tournaments without stars or FSM rating', async () => {
    const page = new MockTablePage();
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td>1</td>
                <td><a href="/tournament/456"><b>Casual Tournament</b></a></td>
                <td class="dates">01.02.2025</td>
                <td class="type">Открытый</td>
                <td class="status">В процессе</td>
                <td class="participants">32</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const scraper = new TournamentsScraper(
      page as unknown as Page,
      rateLimiter
    );
    const [tournament] = await scraper.extractTournamentsFromPage();

    expect(tournament).toMatchObject({
      gomafiaId: '456',
      name: 'Casual Tournament',
      stars: null,
      averageElo: null,
      isFsmRated: false,
      status: 'IN_PROGRESS',
      endDate: null,
    });
  });

  it('parses different star ratings', async () => {
    const page = new MockTablePage();
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td>1</td>
                <td><a href="/tournament/1">22114 <b>T1</b></a></td>
                <td class="dates">01.01.2025 02.01.2025</td>
                <td class="type">Личный</td>
                <td class="status">Завершён</td>
                <td class="participants">16</td>
              </tr>
              <tr>
                <td>2</td>
                <td><a href="/tournament/2">2349 3 <b>T2</b></a></td>
                <td class="dates">01.02.2025 02.02.2025</td>
                <td class="type">Командный</td>
                <td class="status">Завершён</td>
                <td class="participants">32</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const scraper = new TournamentsScraper(
      page as unknown as Page,
      rateLimiter
    );
    const tournaments = await scraper.extractTournamentsFromPage();

    expect(tournaments[0].stars).toBe(4);
    expect(tournaments[1].stars).toBe(3);
  });

  it('maps Russian status labels to enum values', async () => {
    const page = new MockTablePage();
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr>
                <td>1</td>
                <td><a href="/tournament/1"><b>T1</b></a></td>
                <td class="dates">01.03.2025</td>
                <td class="type">Личный</td>
                <td class="status">Запланирован</td>
                <td class="participants">0</td>
              </tr>
              <tr>
                <td>2</td>
                <td><a href="/tournament/2"><b>T2</b></a></td>
                <td class="dates">05.03.2025</td>
                <td class="type">Личный</td>
                <td class="status">Отменён</td>
                <td class="participants">0</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const scraper = new TournamentsScraper(
      page as unknown as Page,
      rateLimiter
    );
    const tournaments = await scraper.extractTournamentsFromPage();

    expect(tournaments[0].status).toBe('SCHEDULED');
    expect(tournaments[1].status).toBe('CANCELLED');
  });
});
