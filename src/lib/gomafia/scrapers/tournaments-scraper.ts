import { Page } from 'playwright';
import { RateLimiter } from '../import/rate-limiter';
import { RetryManager } from '../import/retry-manager';
import { PaginationHandler } from './pagination-handler';
import { TournamentRawData } from '@/types/gomafia-entities';

/**
 * Scraper for tournaments list from gomafia.pro/tournaments endpoint.
 * Extracts tournament data including stars, average ELO, FSM rating, dates, and participant count.
 *
 * Features:
 * - Automatic retry on transient failures with exponential backoff
 * - Rate limiting to respect server resources
 * - Pagination handling for large datasets
 */
export class TournamentsScraper {
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
   * Scrape all tournaments with pagination.
   */
  async scrapeAllTournaments(
    options: {
      timeFilter?: 'all' | 'upcoming' | 'past';
      fsmFilter?: boolean;
      maxPages?: number;
      onProgress?: (pageNumber: number, currentTotal: number) => void;
      onPageData?: (
        pageNumber: number,
        data: TournamentRawData[]
      ) => Promise<void>;
      skipOnError?: boolean;
    } = {}
  ): Promise<{ data: TournamentRawData[]; skippedPages: number[] }> {
    const timeFilter = options.timeFilter || 'all';
    const baseUrl = `https://gomafia.pro/tournaments?time=${timeFilter}`;

    return await this.paginationHandler.scrapeAllPages<TournamentRawData>({
      baseUrl,
      pageParam: 'page',
      hasNextSelector: '.pagination .next',
      maxPages: options.maxPages,
      extractDataFn: async () => this.extractTournamentsFromPage(),
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
   * @returns Array of scraped tournament data from retried pages
   */
  async retrySkippedPages(
    pageNumbers: number[],
    options: {
      timeFilter?: 'all' | 'upcoming' | 'past';
      onPageData?: (
        pageNumber: number,
        data: TournamentRawData[]
      ) => Promise<void>;
    } = {}
  ): Promise<TournamentRawData[]> {
    const timeFilter = options.timeFilter || 'all';
    const baseUrl = `https://gomafia.pro/tournaments?time=${timeFilter}`;

    return await this.paginationHandler.retrySkippedPages<TournamentRawData>(
      {
        baseUrl,
        pageParam: 'page',
        hasNextSelector: '.pagination .next',
        extractDataFn: async () => this.extractTournamentsFromPage(),
        onPageData: options.onPageData,
        skipOnError: true,
      },
      pageNumbers
    );
  }

  /**
   * Extract tournament data from current page's table.
   * Wrapped with retry logic for resilience against transient failures.
   *
   * Table structure: | | Tournament+Location | Dates | Type | Status | |
   * - Tournament link contains <div><span with stars>RATING<b>NAME</b></span></div>
   * - Must extract name from <b> tag only to avoid including star rating number
   */
  async extractTournamentsFromPage(): Promise<TournamentRawData[]> {
    return await this.retryManager.execute(async () => {
      return await this.page.$$eval('table tbody tr', (rows) => {
        const parseStars = (starText: string): number | null => {
          if (!starText || starText.trim() === '') return null;

          // The format can be:
          // 1. A single number like "22114" where last digit is stars: "2211" (averageElo) + "4" (stars)
          // 2. Space-separated like "2349 5" where "2349" is averageElo and "5" is stars
          // 3. Just stars like "3" (only stars, no averageElo)

          // Try parsing as a single number first (most common case)
          const singleNumber = parseInt(starText.trim());
          if (!isNaN(singleNumber) && singleNumber >= 0) {
            // Extract last digit as stars (0-5)
            const lastDigit = singleNumber % 10;
            if (lastDigit >= 0 && lastDigit <= 5) {
              return lastDigit;
            }
          }

          // Fallback: try space-separated format
          const numbers = starText
            .trim()
            .split(/\s+/)
            .map((s) => parseInt(s.trim()))
            .filter((n) => !isNaN(n) && n >= 0);
          // Find the number that's between 0-5 (star rating)
          const starRating = numbers.find((n) => n >= 0 && n <= 5);
          return starRating !== undefined ? starRating : null;
        };

        const parseStatus = (
          russianStatus: string
        ): 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' => {
          const status = russianStatus.toLowerCase().trim();
          if (status.includes('завершён') || status.includes('завершен'))
            return 'COMPLETED';
          if (
            status.includes('в процессе') ||
            status.includes('идёт') ||
            status.includes('идет')
          )
            return 'IN_PROGRESS';
          if (status.includes('отменён') || status.includes('отменен'))
            return 'CANCELLED';
          return 'SCHEDULED';
        };

        const tournaments: TournamentRawData[] = [];

        for (const row of rows) {
          const cells = row.querySelectorAll('td');

          // Skip rows without enough cells
          if (cells.length < 5) {
            continue;
          }

          // Cell 1: Tournament name + Location
          const tournamentCell = cells[1];
          const tournamentLink = tournamentCell?.querySelector(
            'a[href*="/tournament/"]'
          ) as HTMLAnchorElement;

          if (!tournamentLink || !tournamentLink.href) {
            continue;
          }

          const gomafiaId = tournamentLink.href.split('/').pop() || '';
          if (!gomafiaId || gomafiaId.trim() === '') {
            continue;
          }

          // Extract tournament name from <b> tag only (avoids including star rating)
          const nameElement = tournamentLink?.querySelector('b');
          const name = nameElement?.textContent?.trim() || '';

          if (!name || name.length < 2 || !nameElement) {
            continue;
          }

          // Extract star rating and average ELO from the link content
          // The link structure is: [averageElo] [stars] <b>name</b>
          // Example: "2349 5 Кубок России 2025" -> averageElo: 2349, stars: 5
          // Get all text content before the <b> tag (the numbers)
          const linkTextContent = tournamentLink.textContent?.trim() || '';
          const nameText = nameElement.textContent?.trim() || '';
          // Remove the name from the link text to get just the numbers
          const numbersText = linkTextContent.replace(nameText, '').trim();

          // Parse star rating (0-5) and average ELO
          // Format can be:
          // 1. Single number: "22114" = averageElo: 2211, stars: 4 (last digit is stars)
          // 2. Space-separated: "2349 5" = averageElo: 2349, stars: 5
          // 3. Just stars: "3" = stars: 3, averageElo: null

          // Try parsing as single number first
          const singleNumber = parseInt(numbersText.trim());
          let stars: number | null = null;
          let averageEloValue: number | null = null;

          if (!isNaN(singleNumber) && singleNumber >= 0) {
            // Extract last digit as stars (0-5)
            const lastDigit = singleNumber % 10;
            if (lastDigit >= 0 && lastDigit <= 5) {
              stars = lastDigit;
              // Everything before last digit is averageElo
              const eloPart = Math.floor(singleNumber / 10);
              if (eloPart > 0 && eloPart <= 5000) {
                averageEloValue = eloPart;
              }
            }
          }

          // If single number parsing didn't work, try space-separated format
          if (stars === null) {
            stars = parseStars(numbersText);
            const numbers = numbersText
              .split(/\s+/)
              .map((s) => parseInt(s.trim()))
              .filter((n) => !isNaN(n) && n >= 0);
            // Find average ELO: it should be > 5 but <= 5000 (typical ELO range)
            averageEloValue = numbers.find((n) => n > 5 && n <= 5000) || null;
          }

          // Cell 2: Dates (start and end)
          // Format: "01.11.2025 02.11.2025" or "01.11.2025 – 02.11.2025"
          // The dates are in separate div elements or as space-separated text
          const datesCell = cells[2];
          if (!datesCell) {
            continue;
          }

          // Try to get dates from nested div elements first (more reliable)
          const dateElements = datesCell.querySelectorAll('div > div');
          let startDate = '';
          let endDateText = '';

          // Extract all date strings from div elements (filter out empty ones)
          const dateStrings = Array.from(dateElements)
            .map((el) => el.textContent?.trim() || '')
            .filter(
              (text) => text !== '' && /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(text)
            );

          if (dateStrings.length >= 1) {
            startDate = dateStrings[0];
          }
          if (dateStrings.length >= 2) {
            endDateText = dateStrings[dateStrings.length - 1]; // Use last date as end date
          }

          // If we didn't find dates in div elements, try parsing the cell text directly
          if (!startDate || startDate.trim() === '') {
            const cellText = datesCell.textContent?.trim() || '';
            // Parse "DD.MM.YYYY DD.MM.YYYY" or "DD.MM.YYYY – DD.MM.YYYY"
            // Handle cases where dates are concatenated without spaces: "01.11.202502.11.2025"
            const dateMatch = cellText.match(
              /(\d{1,2}\.\d{1,2}\.\d{4})(?:[\s–-]+)?(\d{1,2}\.\d{1,2}\.\d{4})?/
            );
            if (dateMatch) {
              startDate = dateMatch[1];
              endDateText = dateMatch[2] || '';
            }
          }

          if (!startDate || startDate.trim() === '') {
            continue;
          }

          // Clean up end date - remove dashes and normalize
          const endDate =
            endDateText &&
            endDateText !== '–' &&
            endDateText !== '—' &&
            endDateText !== '-' &&
            endDateText !== '' &&
            endDateText !== startDate
              ? endDateText.trim()
              : null;

          // Cell 3: Tournament type (Личный/Командный)
          // Not used in current schema but available if needed

          // Cell 4: Status
          const statusCell = cells[4];
          const statusText = statusCell?.textContent?.trim() || '';
          const status = parseStatus(statusText);

          // Note: isFsmRated is not available in this table view
          // It would need to be scraped from individual tournament pages
          const isFsmRated = false;
          // averageElo is extracted from the link content above
          // participants is not available in this table view
          const participants = 0;

          tournaments.push({
            gomafiaId,
            name,
            stars,
            averageElo: averageEloValue,
            isFsmRated,
            startDate,
            endDate,
            status,
            participants,
          });
        }

        return tournaments;
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
