import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import type { Page } from 'playwright';
import { TournamentGamesScraper } from '@/lib/gomafia/scrapers/tournament-games-scraper';

class MockPage {
  private currentHtml = '';

  constructor(private readonly htmlMap: Record<string, string>) {}

  async goto(url: string) {
    const match = url.match(/tournament\/(\w+)/);
    const id = match?.[1] ?? 'default';
    this.currentHtml = this.htmlMap[id] ?? '';
  }

  async waitForSelector(selectorList: string) {
    const dom = new JSDOM(this.currentHtml);
    const selectors = selectorList.split(',').map((s) => s.trim());
    const found = selectors.some((selector) =>
      dom.window.document.querySelector(selector)
    );
    if (!found) throw new Error('Selector not found');
  }

  async textContent(selector: string) {
    const dom = new JSDOM(this.currentHtml);
    return dom.window.document.querySelector(selector)?.textContent ?? null;
  }

  async evaluate<R>(fn: (param?: unknown) => R, param?: unknown) {
    const dom = new JSDOM(this.currentHtml);
    const originalDocument = global.document;
    const originalWindow = (global as unknown as { window?: Window }).window;

    (global as unknown as { document: Document }).document =
      dom.window.document;
    (global as unknown as { window: Window }).window = dom.window;

    try {
      return fn(param);
    } finally {
      (global as unknown as { document: Document }).document = originalDocument;
      (global as unknown as { window: Window | undefined }).window =
        originalWindow;
    }
  }
}

describe('TournamentGamesScraper', () => {
  it('parses game tables with participants', async () => {
    const table = `
      <table>
        <thead>
          <tr><th>Стол 1</th></tr>
          <tr><th>Победа мафии</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Player One</td>
            <td>Дон</td>
            <td>8.5</td>
            <td>+3</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Player Two</td>
            <td>Мирный</td>
            <td>6.0</td>
            <td>-1</td>
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr><th>Стол 2</th></tr>
          <tr><th>Победа мирных</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Player Three</td>
            <td>Мафия</td>
            <td>5.0</td>
            <td>-2</td>
          </tr>
        </tbody>
      </table>
    `;

    const page = new MockPage({ '123': `<html><body>${table}</body></html>` });
    const scraper = new TournamentGamesScraper(page as unknown as Page);

    const games = await scraper.scrapeGames('123');

    expect(games).toHaveLength(2);
    expect(games[0]).toMatchObject({
      winnerTeam: 'BLACK',
      durationMinutes: null,
    });
    expect(games[0].participations?.[0]).toMatchObject({
      playerName: 'Player One',
      role: 'DON',
      team: 'BLACK',
      isWinner: true,
    });
    expect(games[0].participations?.[1]).toMatchObject({
      playerName: 'Player Two',
      role: 'CITIZEN',
      team: 'RED',
      isWinner: false,
    });
    expect(games[1].winnerTeam).toBe('RED');
  });

  it('returns empty array when page indicates no games', async () => {
    const html = `
      <html>
        <body>
          <div>Игр пока нет</div>
        </body>
      </html>
    `;

    const page = new MockPage({ '999': html });
    const scraper = new TournamentGamesScraper(page as unknown as Page);

    const games = await scraper.scrapeGames('999');
    expect(games).toEqual([]);
  });
});
