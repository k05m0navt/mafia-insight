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

        return rows.map((row) => {
          const cells = row.querySelectorAll('td');

          // Cell 0: Judge (link to /stats/{id})
          const judgeCell = cells[0];
          const judgeLink = judgeCell?.querySelector(
            'a[href*="/stats/"]'
          ) as HTMLAnchorElement;
          const name = judgeLink?.textContent?.trim() || '';
          const gomafiaId = judgeLink?.href?.split('/').pop() || '';

          // Cell 1: Category (e.g., "Высшая категория", "1 категория")
          const category = cells[1]?.textContent?.trim() || null;

          // Cell 2: Can be GS (number)
          const canBeGsText = cells[2]?.textContent?.trim() || '';
          const canBeGs =
            canBeGsText && canBeGsText !== '–' && canBeGsText !== '—'
              ? parseInt(canBeGsText)
              : null;

          // Cell 3: Can judge final (boolean - shown as "5" or "Да")
          const canJudgeFinalText = cells[3]?.textContent?.trim() || '';
          const canJudgeFinal = parseBoolean(canJudgeFinalText);

          // Cell 4: Max tables as GS (number)
          const maxTablesAsGsText = cells[4]?.textContent?.trim() || '';
          const maxTablesAsGs =
            maxTablesAsGsText &&
            maxTablesAsGsText !== '–' &&
            maxTablesAsGsText !== '—'
              ? parseInt(maxTablesAsGsText)
              : null;

          // Cell 5: Rating (number)
          const ratingText = cells[5]?.textContent?.trim() || '';
          const rating =
            ratingText && ratingText !== '–' && ratingText !== '—'
              ? parseInt(ratingText)
              : null;

          // Cell 6: Games judged (number)
          const gamesJudgedText = cells[6]?.textContent?.trim() || '';
          const gamesJudged =
            gamesJudgedText &&
            gamesJudgedText !== '–' &&
            gamesJudgedText !== '—'
              ? parseInt(gamesJudgedText)
              : null;

          // Cell 7: Accreditation date (Russian date format)
          const accreditationDateText = cells[7]?.textContent?.trim() || '';
          const accreditationDate = parseDate(accreditationDateText);

          // Cell 8: Responsible from SC FSM
          const responsibleFromSc = cells[8]?.textContent?.trim() || null;

          return {
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
          };
        });
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
