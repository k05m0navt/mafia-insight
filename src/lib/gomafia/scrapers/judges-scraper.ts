import { Page } from 'playwright';
import { RateLimiter } from '../import/rate-limiter';
import { RetryManager } from '../import/retry-manager';
import { PaginationHandler } from './pagination-handler';
import { JudgeRawData } from '@/types/gomafia-entities';

/**
 * Scraper for judges list from gomafia.pro/judges endpoint.
 * Extracts judge data including category, GS capabilities, rating, and accreditation info.
 *
 * Features:
 * - Automatic retry on transient failures with exponential backoff
 * - Rate limiting to respect server resources
 * - Pagination handling for large datasets
 */
export class JudgesScraper {
  private paginationHandler: PaginationHandler;
  private retryManager: RetryManager;

  constructor(
    private page: Page,
    private rateLimiter: RateLimiter,
    retryManager?: RetryManager
  ) {
    this.paginationHandler = new PaginationHandler(page, rateLimiter);
    this.retryManager = retryManager || new RetryManager(3);
  }

  /**
   * Scrape all judges from the judges page with pagination.
   *
   * @param options Scraping options
   * @returns Array of raw judge data
   *
   * @example
   * const scraper = new JudgesScraper(page, rateLimiter);
   * const judges = await scraper.scrapeAllJudges({
   *   maxPages: 10
   * });
   */
  async scrapeAllJudges(
    options: {
      maxPages?: number;
      onProgress?: (pageNumber: number, currentTotal: number) => void;
      onPageData?: (pageNumber: number, data: JudgeRawData[]) => Promise<void>;
      skipOnError?: boolean;
    } = {}
  ): Promise<{ data: JudgeRawData[]; skippedPages: number[] }> {
    const baseUrl = 'https://gomafia.pro/judges?tab=all';

    return await this.paginationHandler.scrapeAllPages<JudgeRawData>({
      baseUrl,
      pageParam: 'pageJudges',
      hasNextSelector: '.pagination .next',
      maxPages: options.maxPages,
      extractDataFn: async () => this.extractJudgesFromPage(),
      onProgress: options.onProgress,
      onPageData: options.onPageData,
      skipOnError: options.skipOnError ?? true, // Default to skipping errors
    });
  }

  /**
   * Retry scraping specific pages that were skipped.
   *
   * @param pageNumbers Array of page numbers to retry
   * @param options Scraping options (must match original scraping options)
   * @returns Array of scraped judge data from retried pages
   */
  async retrySkippedPages(
    pageNumbers: number[],
    options: {
      onPageData?: (pageNumber: number, data: JudgeRawData[]) => Promise<void>;
    } = {}
  ): Promise<JudgeRawData[]> {
    const baseUrl = 'https://gomafia.pro/judges?tab=all';

    return await this.paginationHandler.retrySkippedPages<JudgeRawData>(
      {
        baseUrl,
        pageParam: 'pageJudges',
        hasNextSelector: '.pagination .next',
        extractDataFn: async () => this.extractJudgesFromPage(),
        onPageData: options.onPageData,
        skipOnError: true,
      },
      pageNumbers
    );
  }

  /**
   * Extract judge data from current page's table.
   * Internal method used by pagination handler.
   * Wrapped with retry logic for resilience against transient failures.
   *
   * Table structure: | Judge | Category | Can be GS | Can judge final | Max tables as GS | Rating | Games judged | Accreditation date | Responsible from SC FSM |
   */
  async extractJudgesFromPage(): Promise<JudgeRawData[]> {
    return await this.retryManager.execute(async () => {
      // Wait for table to load (important for tab-based pages)
      // The judges page uses tabs, so content loads dynamically
      try {
        // Wait for table structure - try multiple selectors
        await Promise.race([
          this.page.waitForSelector('table tbody tr', { timeout: 10000 }),
          this.page.waitForSelector('table tr', { timeout: 10000 }),
          this.page.waitForSelector('tbody tr', { timeout: 10000 }),
        ]);
      } catch (_error) {
        // If table doesn't appear, page might be empty or tab not active
        console.warn('[JudgesScraper] Table not found, page might be empty');
        // Check if page loaded at all
        const hasTable = await this.page.$('table').catch(() => null);
        if (!hasTable) {
          console.warn('[JudgesScraper] No table element found on page');
        }
        return [];
      }

      // Additional wait for network to ensure tab content is fully loaded
      await Promise.race([
        this.page.waitForLoadState('networkidle', { timeout: 5000 }),
        new Promise((resolve) => setTimeout(resolve, 2000)), // Fallback: wait 2 seconds
      ]);

      // Verify table has rows before extracting
      const rowCount = await this.page.$$eval(
        'table tbody tr',
        (rows) => rows.length
      );
      if (rowCount === 0) {
        console.warn('[JudgesScraper] Table found but no rows detected');
        return [];
      }

      return await this.page.$$eval('table tbody tr', (rows) => {
        const parseBoolean = (text: string | null | undefined): boolean => {
          if (!text) return false;
          const lower = text.toLowerCase().trim();
          // Check for "Да" (Yes) or "5" (can judge final is shown as number 5)
          return (
            lower === 'да' ||
            lower === 'yes' ||
            lower === 'true' ||
            lower === '5' ||
            parseInt(lower) === 5
          );
        };

        const parseDate = (text: string | null | undefined): string | null => {
          if (!text || text.trim() === '' || text === '–' || text === '—')
            return null;
          // Format: "1 января 2016 г." or "24 января 2022 г."
          // Parse Russian date format
          const months: { [key: string]: string } = {
            января: '01',
            февраля: '02',
            марта: '03',
            апреля: '04',
            мая: '05',
            июня: '06',
            июля: '07',
            августа: '08',
            сентября: '09',
            октября: '10',
            ноября: '11',
            декабря: '12',
          };

          const match = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
          if (match) {
            const day = match[1].padStart(2, '0');
            const monthName = match[2];
            const year = match[3];
            const month = months[monthName] || '01';
            return `${year}-${month}-${day}`;
          }
          return null;
        };

        const judges: JudgeRawData[] = [];

        for (const row of rows) {
          const cells = row.querySelectorAll('td');

          // Skip header row - check if this row has header-like content
          const firstCellText = cells[0]?.textContent?.trim() || '';
          if (firstCellText === 'Судья' || cells.length < 9) {
            continue; // Skip header row
          }

          // Cell 0: Empty (checkbox or index column)
          // Cell 1: Judge (link to /stats/{id}) - THIS IS THE ACTUAL JUDGE CELL
          const judgeCell = cells[1]; // Changed from cells[0] to cells[1]
          const judgeLink = judgeCell?.querySelector(
            'a[href*="/stats/"]'
          ) as HTMLAnchorElement;

          // Get full name from cell text (includes both nickname and real name)
          // Format is typically: "NicknameReal Name" (e.g., "АрдыльянНиколай Ардыльян")
          const cellText = judgeCell?.textContent?.trim() || '';
          const name = cellText || judgeLink?.textContent?.trim() || '';

          // Extract gomafiaId from href - handle both relative and absolute URLs
          let gomafiaId = '';
          if (judgeLink?.href) {
            const href = judgeLink.href;
            // Handle both "/stats/12345" and "https://gomafia.pro/stats/12345"
            const match = href.match(/\/stats\/(\d+)/);
            gomafiaId = match ? match[1] : href.split('/').pop() || '';
          }

          // If no gomafiaId found, skip this row (it's invalid)
          if (!gomafiaId || !name || name.trim() === '') {
            continue;
          }

          // Cell 2: Category (e.g., "Высшая категория", "1 категория")
          const category = cells[2]?.textContent?.trim() || null;

          // Cells 3-4: Empty (spacer columns)

          // Cell 5: Max tables as GS (number) - Header says "Максимум столов в роли ГС"
          const maxTablesAsGsText = cells[5]?.textContent?.trim() || '';
          const maxTablesAsGs =
            maxTablesAsGsText &&
            maxTablesAsGsText !== '–' &&
            maxTablesAsGsText !== '—'
              ? parseInt(maxTablesAsGsText)
              : null;

          // Cell 6: Can judge final (boolean - shown as "5" or "Да") - Header says "Рейтинг" but value "5" indicates can judge final
          const canJudgeFinalText = cells[6]?.textContent?.trim() || '';
          const canJudgeFinal = parseBoolean(canJudgeFinalText);

          // Cell 7: Games judged (number) - Header says "Игр отсудил"
          const gamesJudgedText = cells[7]?.textContent?.trim() || '';
          const gamesJudged =
            gamesJudgedText &&
            gamesJudgedText !== '–' &&
            gamesJudgedText !== '—'
              ? parseInt(gamesJudgedText)
              : null;

          // Cell 8: Accreditation date (Russian date format) - Header says "Дата аккредитации"
          const accreditationDateText = cells[8]?.textContent?.trim() || '';
          const accreditationDate = parseDate(accreditationDateText);

          // Cell 9: Responsible from SC FSM - Header says "Ответственный от СК ФСМ"
          const responsibleFromSc = cells[9]?.textContent?.trim() || null;

          // Can be GS and Rating are not in the visible columns based on the table structure
          // These might be in cells 3-4 which are empty, or the table structure changed
          // Setting to null for now - can be updated if these fields are found elsewhere
          const canBeGs = null; // Not found in visible columns
          const rating = null; // Not found in visible columns (was in old structure)

          judges.push({
            gomafiaId,
            name,
            category,
            canBeGs,
            canJudgeFinal,
            maxTablesAsGs,
            rating,
            gamesJudged,
            accreditationDate,
            responsibleFromSc,
          });
        }

        return judges;
      });
    });
  }

  /**
   * Get scraping metrics for monitoring.
   * Includes both rate limiting and retry statistics.
   */
  getMetrics() {
    return {
      rateLimit: this.rateLimiter.getMetrics(),
      retry: this.retryManager.getMetrics(),
    };
  }

  /**
   * Get retry manager for advanced configuration or monitoring.
   */
  getRetryManager(): RetryManager {
    return this.retryManager;
  }
}
