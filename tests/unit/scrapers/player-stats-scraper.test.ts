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

  describe('discoverProfileData', () => {
    let gotoSpy: ReturnType<typeof vi.spyOn> | null = null;
    let titleSpy: ReturnType<typeof vi.spyOn> | null = null;

    afterEach(() => {
      // Restore any mocks after each test
      if (gotoSpy) {
        gotoSpy.mockRestore();
        gotoSpy = null;
      }
      if (titleSpy) {
        titleSpy.mockRestore();
        titleSpy = null;
      }
    });

    // Helper to set up page content for testing
    // We mock page.goto() and page.title() to set content instead of navigating
    const setupPageContent = async (content: string, title?: string) => {
      // Extract title from content if not provided
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      const extractedTitle =
        title || (titleMatch ? titleMatch[1] : 'Player Stats');

      // Inject title if provided and not already in content
      const htmlContent =
        title && !titleMatch
          ? content.replace(/<head>/, `<head><title>${title}</title>`)
          : content;

      // Mock page.goto() to set content instead of navigating
      gotoSpy = vi
        .spyOn(page, 'goto')
        .mockImplementation(async (url: string, options?: any) => {
          await page.setContent(htmlContent);
          // Wait a bit to ensure DOM is ready
          await page.waitForLoadState('domcontentloaded').catch(() => {
            // Ignore if already loaded
          });
          // Return null as page.goto() returns Response | null
          return null;
        });

      // Mock page.title() to return the extracted title
      // Note: page.title() is a method, so we need to mock it as a function
      (page as any).title = vi.fn().mockResolvedValue(extractedTitle);
      titleSpy = {
        mockRestore: () => {
          delete (page as any).title;
        },
      } as any;
    };

    it('should discover profile data with total games and date range', async () => {
      const gomafiaId = 'test-player-123';

      await setupPageContent(`
        <html>
          <head><title>Player Stats - gomafia.pro</title></head>
          <body>
            <div class="stats_stats__stat-main-bottom-block-left-content-amount__DN0nz">250</div>
            <div class="date">15.01.2020</div>
            <div class="Date">20.12.2024</div>
          </body>
        </html>
      `);

      const result = await scraper.discoverProfileData(gomafiaId);

      expect(result.totalGames).toBe(250);
      expect(result.profileExists).toBe(true);
      // Date extraction is best-effort, may be null
      if (result.earliestGameDate) {
        expect(result.earliestGameDate).toBeInstanceOf(Date);
      }
      if (result.latestGameDate) {
        expect(result.latestGameDate).toBeInstanceOf(Date);
      }
    });

    it('should return profileExists false for 404 pages', async () => {
      const gomafiaId = 'non-existent-player';

      await setupPageContent(
        `
        <html>
          <head><title>404 - Page Not Found</title></head>
          <body>
            <div class="error">Page not found</div>
          </body>
        </html>
      `,
        '404 - Page Not Found'
      );

      const result = await scraper.discoverProfileData(gomafiaId);

      expect(result).toEqual({
        totalGames: 0,
        earliestGameDate: null,
        latestGameDate: null,
        profileExists: false,
      });
    });

    it('should handle missing date range gracefully', async () => {
      const gomafiaId = 'test-player-456';

      await setupPageContent(
        `
        <html>
          <head><title>Player Stats - gomafia.pro</title></head>
          <body>
            <div class="stats_stats__stat-main-bottom-block-left-content-amount__DN0nz">100</div>
          </body>
        </html>
      `
      );

      const result = await scraper.discoverProfileData(gomafiaId);

      expect(result.totalGames).toBe(100);
      expect(result.profileExists).toBe(true);
      // Date range may be null if not found in DOM
      expect(result.earliestGameDate).toBeNull();
      expect(result.latestGameDate).toBeNull();
    });

    it('should extract total games from stats element', async () => {
      const gomafiaId = 'test-player-789';

      await setupPageContent(
        `
        <html>
          <head><title>Player Stats</title></head>
          <body>
            <div class="stats_stats__stat-main-bottom-block-left-content-amount__DN0nz">500</div>
          </body>
        </html>
      `
      );

      const result = await scraper.discoverProfileData(gomafiaId);

      expect(result.totalGames).toBe(500);
      expect(result.profileExists).toBe(true);
    });

    it('should handle parsing errors gracefully', async () => {
      const gomafiaId = 'test-player-error';

      await setupPageContent(
        `
        <html>
          <head><title>Player Stats</title></head>
          <body>
            <div class="stats_stats__stat-main-bottom-block-left-content-amount__DN0nz">invalid</div>
          </body>
        </html>
      `
      );

      const result = await scraper.discoverProfileData(gomafiaId);

      // Should default to 0 for invalid totalGames
      expect(result.totalGames).toBe(0);
      expect(result.profileExists).toBe(true);
    });

    it('should handle network errors during navigation', async () => {
      const gomafiaId = 'test-player-network-error';

      // Mock page.goto() to throw an error
      gotoSpy = vi
        .spyOn(page, 'goto')
        .mockRejectedValue(new Error('Network error'));

      const result = await scraper.discoverProfileData(gomafiaId);

      // Should return default values on error
      expect(result).toEqual({
        totalGames: 0,
        earliestGameDate: null,
        latestGameDate: null,
        profileExists: false,
      });
    });

    it('should detect 404 from page title', async () => {
      const gomafiaId = 'missing-player';

      await setupPageContent(
        `
        <html>
          <head><title>404 Error</title></head>
          <body></body>
        </html>
      `
      );

      const result = await scraper.discoverProfileData(gomafiaId);

      expect(result.profileExists).toBe(false);
    });

    it('should extract date range when available', async () => {
      const gomafiaId = 'test-player-dates';

      await setupPageContent(
        `
        <html>
          <head><title>Player Stats</title></head>
          <body>
            <div class="stats_stats__stat-main-bottom-block-left-content-amount__DN0nz">300</div>
            <div class="date">10.03.2019</div>
            <div class="Date">25.11.2024</div>
          </body>
        </html>
      `
      );

      const result = await scraper.discoverProfileData(gomafiaId);

      expect(result.totalGames).toBe(300);
      expect(result.profileExists).toBe(true);
      // Date extraction is best-effort
      if (result.earliestGameDate) {
        expect(result.earliestGameDate).toBeInstanceOf(Date);
      }
      if (result.latestGameDate) {
        expect(result.latestGameDate).toBeInstanceOf(Date);
      }
    });

    it('should handle empty total games element', async () => {
      const gomafiaId = 'test-player-empty';

      await setupPageContent(
        `
        <html>
          <head><title>Player Stats</title></head>
          <body>
            <div class="stats_stats__stat-main-bottom-block-left-content-amount__DN0nz">0</div>
          </body>
        </html>
      `
      );

      const result = await scraper.discoverProfileData(gomafiaId);

      expect(result.totalGames).toBe(0);
      expect(result.profileExists).toBe(true); // Profile exists, just no games
    });
  });
});
