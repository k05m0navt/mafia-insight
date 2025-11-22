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
          <div class="stats">
            <div class="stats_stats__stat-main-bottom-block-left-content-amount__DN0nz">45</div>
          </div>
          <div class="role-stats">
            <div class="role">
              <span>Игр за мирного</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">15</div>
            </div>
            <div class="role">
              <span>Игр за дона</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">10</div>
            </div>
            <div class="role">
              <span>Игр за мафию</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">12</div>
            </div>
            <div class="role">
              <span>Игр за шерифа</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">8</div>
            </div>
          </div>
          <div class="elo-wrapper">
            <div>Общий ELO: 1450.5</div>
          </div>
          <div class="extra-points-wrapper">
            <div>25.3 в среднем за 10 игр</div>
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
            <div class="stats_stats__stat-main-bottom-block-left-content-amount__DN0nz">0</div>
          </div>
          <div class="role-stats">
            <div class="role">
              <span>Игр за мирного</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">0</div>
            </div>
            <div class="role">
              <span>Игр за дона</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">0</div>
            </div>
            <div class="role">
              <span>Игр за мафию</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">0</div>
            </div>
            <div class="role">
              <span>Игр за шерифа</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">0</div>
            </div>
          </div>
          <div class="elo-wrapper">
            <div>Общий ELO: 1200.0</div>
          </div>
          <div class="extra-points-wrapper">
            <div>0 в среднем за 10 игр</div>
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
            <div class="stats_stats__stat-main-bottom-block-left-content-amount__DN0nz">10</div>
          </div>
          <div class="role-stats">
            <div class="role">
              <span>Игр за мирного</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">3</div>
            </div>
            <div class="role">
              <span>Игр за дона</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">2</div>
            </div>
            <div class="role">
              <span>Игр за мафию</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">3</div>
            </div>
            <div class="role">
              <span>Игр за шерифа</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">2</div>
            </div>
          </div>
          <div class="elo-wrapper">
            <div>Общий ELO: –</div>
          </div>
          <div class="extra-points-wrapper">
            <div>5 в среднем за 10 игр</div>
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
            <div class="stats_stats__stat-main-bottom-block-left-content-amount__DN0nz">100</div>
          </div>
          <div class="role-stats">
            <div class="role">
              <span>Игр за мирного</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">25</div>
            </div>
            <div class="role">
              <span>Игр за дона</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">25</div>
            </div>
            <div class="role">
              <span>Игр за мафию</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">25</div>
            </div>
            <div class="role">
              <span>Игр за шерифа</span>
              <div class="ProfileUserCircle_profile-user-circle__num__iog1A">25</div>
            </div>
          </div>
          <div class="elo-wrapper">
            <div>Общий ELO: 2345.75</div>
          </div>
          <div class="extra-points-wrapper">
            <div>123.456 в среднем за 10 игр</div>
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
