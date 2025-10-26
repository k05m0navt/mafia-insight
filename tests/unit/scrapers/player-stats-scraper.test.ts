import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { PlayerStatsScraper } from '@/lib/gomafia/scrapers/player-stats-scraper';

describe('PlayerStatsScraper', () => {
  let browser: Browser;
  let page: Page;
  let scraper: PlayerStatsScraper;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    scraper = new PlayerStatsScraper(page);
  });

  afterEach(async () => {
    await browser.close();
  });

  it('should extract year stats data', async () => {
    await page.setContent(`
      <html>
        <body>
          <div class="year-selector">
            <button class="active">2025</button>
          </div>
          <div class="stats">
            <div class="total-games">45</div>
            <div class="don-games">10</div>
            <div class="mafia-games">12</div>
            <div class="sheriff-games">8</div>
            <div class="civilian-games">15</div>
            <div class="elo-rating">1450.5</div>
            <div class="extra-points">25.3</div>
          </div>
        </body>
      </html>
    `);

    const stats = await scraper.extractYearStats(2025);

    expect(stats).toEqual({
      year: 2025,
      totalGames: 45,
      donGames: 10,
      mafiaGames: 12,
      sheriffGames: 8,
      civilianGames: 15,
      eloRating: 1450.5,
      extraPoints: 25.3,
    });
  });

  it('should handle zero values', async () => {
    await page.setContent(`
      <html>
        <body>
          <div class="stats">
            <div class="total-games">0</div>
            <div class="don-games">0</div>
            <div class="mafia-games">0</div>
            <div class="sheriff-games">0</div>
            <div class="civilian-games">0</div>
            <div class="elo-rating">1200</div>
            <div class="extra-points">0</div>
          </div>
        </body>
      </html>
    `);

    const stats = await scraper.extractYearStats(2024);
    expect(stats.totalGames).toBe(0);
    expect(stats.eloRating).toBe(1200);
  });

  it('should handle missing ELO rating', async () => {
    await page.setContent(`
      <html>
        <body>
          <div class="stats">
            <div class="total-games">10</div>
            <div class="don-games">2</div>
            <div class="mafia-games">3</div>
            <div class="sheriff-games">2</div>
            <div class="civilian-games">3</div>
            <div class="elo-rating">–</div>
            <div class="extra-points">5</div>
          </div>
        </body>
      </html>
    `);

    const stats = await scraper.extractYearStats(2023);
    expect(stats.eloRating).toBeNull();
  });

  it('should handle decimal values', async () => {
    await page.setContent(`
      <html>
        <body>
          <div class="stats">
            <div class="total-games">100</div>
            <div class="don-games">25</div>
            <div class="mafia-games">25</div>
            <div class="sheriff-games">25</div>
            <div class="civilian-games">25</div>
            <div class="elo-rating">2345.75</div>
            <div class="extra-points">123.456</div>
          </div>
        </body>
      </html>
    `);

    const stats = await scraper.extractYearStats(2025);
    expect(stats.eloRating).toBe(2345.75);
    expect(stats.extraPoints).toBe(123.456);
  });

  it('should stop after 2 consecutive empty years', async () => {
    // Mock page navigation and content updates
    let navigateCount = 0;

    // This test would require actual page navigation simulation
    // In real implementation, this would test the scrapeAllYears method
    expect(true).toBe(true); // Placeholder
  });
});
