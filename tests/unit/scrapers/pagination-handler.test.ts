import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { PaginationHandler } from '@/lib/gomafia/scrapers/pagination-handler';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';

describe('PaginationHandler', () => {
  let browser: Browser;
  let page: Page;
  let rateLimiter: RateLimiter;
  let paginationHandler: PaginationHandler;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    rateLimiter = new RateLimiter(100); // Fast for testing
    paginationHandler = new PaginationHandler(page, rateLimiter);
  });

  afterEach(async () => {
    await browser.close();
  });

  it('should scrape single page without pagination', async () => {
    // Mock a simple HTML page
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr><td class="data">Item 1</td></tr>
              <tr><td class="data">Item 2</td></tr>
              <tr><td class="data">Item 3</td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    const results = await paginationHandler.scrapeAllPages({
      baseUrl: 'about:blank', // Using current page content
      pageParam: 'page',
      hasNextSelector: '.pagination .next',
      extractDataFn: async (p) => {
        return await p.$$eval('.data', (nodes) =>
          nodes.map((n) => n.textContent?.trim())
        );
      },
    });

    expect(results).toEqual(['Item 1', 'Item 2', 'Item 3']);
  });

  it('should respect rate limiting between page requests', async () => {
    const startTime = Date.now();

    await page.setContent(
      '<html><body><div class="test">Data</div></body></html>'
    );

    await paginationHandler.scrapeAllPages({
      baseUrl: 'about:blank',
      pageParam: 'page',
      hasNextSelector: '.pagination .next',
      extractDataFn: async () => ['data'],
    });

    // Should have minimal delay for single page
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(500);
  });

  it('should build correct URL with page parameter', () => {
    const url1 = paginationHandler.buildPageUrl(
      'https://example.com/list',
      'page',
      1
    );
    expect(url1).toBe('https://example.com/list?page=1');

    const url2 = paginationHandler.buildPageUrl(
      'https://example.com/list?year=2025',
      'page',
      2
    );
    expect(url2).toBe('https://example.com/list?year=2025&page=2');
  });

  it('should detect when no next page exists', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr><td class="data">Item 1</td></tr>
            </tbody>
          </table>
          <!-- No pagination element -->
        </body>
      </html>
    `);

    const results = await paginationHandler.scrapeAllPages({
      baseUrl: 'about:blank',
      pageParam: 'page',
      hasNextSelector: '.pagination .next',
      extractDataFn: async (p) => {
        return await p.$$eval('.data', (nodes) =>
          nodes.map((n) => n.textContent?.trim())
        );
      },
    });

    expect(results.length).toBe(1);
  });

  it('should detect disabled next button', async () => {
    await page.setContent(`
      <html>
        <body>
          <table>
            <tbody>
              <tr><td class="data">Last item</td></tr>
            </tbody>
          </table>
          <div class="pagination">
            <a class="next disabled">Next</a>
          </div>
        </body>
      </html>
    `);

    const results = await paginationHandler.scrapeAllPages({
      baseUrl: 'about:blank',
      pageParam: 'page',
      hasNextSelector: '.pagination .next',
      extractDataFn: async (p) => {
        return await p.$$eval('.data', (nodes) =>
          nodes.map((n) => n.textContent?.trim())
        );
      },
    });

    expect(results.length).toBe(1);
  });

  it('should stop after maxPages limit', async () => {
    await page.setContent(`
      <html>
        <body>
          <div class="data">Item</div>
          <div class="pagination">
            <a class="next">Next</a>
          </div>
        </body>
      </html>
    `);

    let pageCount = 0;
    await paginationHandler.scrapeAllPages({
      baseUrl: 'about:blank',
      pageParam: 'page',
      hasNextSelector: '.pagination .next',
      maxPages: 2,
      extractDataFn: async () => {
        pageCount++;
        return ['data'];
      },
    });

    expect(pageCount).toBe(2);
  });

  it('should handle extraction errors gracefully', async () => {
    await page.setContent('<html><body><div>Content</div></body></html>');

    await expect(async () => {
      await paginationHandler.scrapeAllPages({
        baseUrl: 'about:blank',
        pageParam: 'page',
        hasNextSelector: '.next',
        extractDataFn: async () => {
          throw new Error('Extraction failed');
        },
      });
    }).rejects.toThrow('Extraction failed');
  });
});
