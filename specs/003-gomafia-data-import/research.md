# Research: GoMafia Initial Data Import

**Feature**: 003-gomafia-data-import  
**Date**: October 26, 2025  
**Status**: Phase 0 Complete

## Overview

This document captures technical research and decisions made to resolve unknowns in the import implementation. Each decision includes rationale and alternatives considered.

---

## Decision 1: PostgreSQL Advisory Lock Implementation

**Problem**: Need database-level concurrency control to prevent multiple concurrent imports across horizontally scaled application instances.

**Decision**: Use PostgreSQL advisory locks via `pg_try_advisory_lock(lock_id)` with Prisma raw queries.

**Implementation**:

```typescript
// lib/gomafia/import/advisory-lock.ts
import { PrismaClient } from '@prisma/client';

const IMPORT_LOCK_ID = 123456789; // Arbitrary unique integer for this feature

export class AdvisoryLockManager {
  constructor(private db: PrismaClient) {}

  async acquireLock(): Promise<boolean> {
    const result = await this.db.$queryRaw<[{ pg_try_advisory_lock: boolean }]>`
      SELECT pg_try_advisory_lock(${IMPORT_LOCK_ID})
    `;
    return result[0].pg_try_advisory_lock;
  }

  async releaseLock(): Promise<void> {
    await this.db.$queryRaw`
      SELECT pg_advisory_unlock(${IMPORT_LOCK_ID})
    `;
  }

  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const acquired = await this.acquireLock();
    if (!acquired) {
      throw new Error('Import operation already in progress');
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock();
    }
  }
}
```

**Rationale**:

- Works across all application instances (horizontally scaled deployment)
- Automatic cleanup on connection termination (prevents deadlocks)
- Native PostgreSQL feature (no external dependencies)
- Atomic operation (no race conditions)
- Integrates with existing Prisma connection pool

**Alternatives Considered**:

- **Redis distributed lock**: Requires additional infrastructure dependency
- **In-memory flag (SyncStatus.isRunning)**: Race condition window between check and set
- **Queue-based**: Adds complexity, doesn't prevent duplicate triggers

**References**:

- PostgreSQL docs: https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS
- Prisma raw queries: https://www.prisma.io/docs/orm/prisma-client/queries/raw-database-access

---

## Decision 2: Dynamic Content Handling Strategy

**Problem**: Year selector on `/stats/{id}` triggers JavaScript to load new data. Need reliable wait strategy to ensure data is fully loaded before scraping.

**Decision**: Use Playwright's `page.waitForLoadState('networkidle')` after year selection, with fallback timeout.

**Implementation**:

```typescript
// lib/gomafia/scrapers/player-stats-scraper.ts
async function scrapePlayerYearStats(
  page: Page,
  gomafiaId: string,
  year: number
): Promise<PlayerYearStatsData> {
  await page.goto(`https://gomafia.pro/stats/${gomafiaId}`);

  // Click year selector
  await page.click(`button:has-text("${year}")`);

  // Wait for dynamic content to load
  await Promise.race([
    page.waitForLoadState('networkidle', { timeout: 10000 }),
    page.waitForTimeout(5000), // Fallback: minimum wait
  ]);

  // Additional check: verify data element is present
  await page.waitForSelector('.total-games', { timeout: 5000 });

  // Scrape data
  const stats = {
    totalGames: await page.textContent('.total-games'),
    donGames: await page.textContent('.don-games'),
    mafiaGames: await page.textContent('.mafia-games'),
    // ... etc
  };

  return parsePlayerYearStats(stats);
}
```

**Rationale**:

- `networkidle` ensures all AJAX requests complete
- Fallback timeout prevents infinite waiting
- Explicit selector check confirms critical data is present
- 10-second timeout accounts for slow network conditions

**Alternatives Considered**:

- **Fixed timeout only**: Unreliable (may scrape before data loads)
- **DOM mutation observer**: Overly complex, harder to debug
- **waitForResponse**: Requires knowing exact API endpoint (brittle if gomafia.pro changes)

**Best Practices**:

- Always combine multiple wait strategies (network + selector)
- Log warnings if fallback timeout is used
- Implement retry logic (3 attempts) for transient failures

---

## Decision 3: Reusable Pagination Pattern

**Problem**: 8 different endpoints with pagination, need consistent pattern to avoid code duplication.

**Decision**: Generic pagination handler using URL parameter detection.

**Implementation**:

```typescript
// lib/gomafia/scrapers/pagination-handler.ts
interface PaginationConfig {
  baseUrl: string;
  pageParam: string; // e.g., 'page', 'pageUsers', 'pageClubs'
  hasNextSelector: string; // CSS selector for "next page" button
  extractDataFn: (page: Page) => Promise<any[]>;
}

export class PaginationHandler {
  constructor(
    private page: Page,
    private rateLimiter: RateLimiter
  ) {}

  async scrapeAllPages<T>(config: PaginationConfig): Promise<T[]> {
    const allData: T[] = [];
    let currentPage = 1;

    while (true) {
      // Navigate to page
      const url = `${config.baseUrl}${config.baseUrl.includes('?') ? '&' : '?'}${config.pageParam}=${currentPage}`;
      await this.page.goto(url);
      await this.rateLimiter.wait(); // 2-second delay

      // Extract data from current page
      const pageData = await config.extractDataFn(this.page);
      allData.push(...pageData);

      // Check for next page
      const hasNext = await this.page.$(config.hasNextSelector);
      const isDisabled = hasNext
        ? await hasNext.evaluate((el) => el.classList.contains('disabled'))
        : true;

      if (!hasNext || isDisabled) {
        break; // Last page reached
      }

      currentPage++;
    }

    return allData;
  }
}

// Usage example
const playersScraper = new PaginationHandler(page, rateLimiter);
const players = await playersScraper.scrapeAllPages<PlayerData>({
  baseUrl: 'https://gomafia.pro/rating?yearUsers=2025&regionUsers=all',
  pageParam: 'pageUsers',
  hasNextSelector: '.pagination .next',
  extractDataFn: async (page) => {
    return await page.$$eval('table tbody tr', (rows) =>
      rows.map((row) => ({
        name: row.querySelector('.player-name')?.textContent,
        elo: row.querySelector('.elo')?.textContent,
        // ... etc
      }))
    );
  },
});
```

**Rationale**:

- Single implementation reused across all 8 endpoints
- Configuration-driven (declarative, easy to test)
- Built-in rate limiting integration
- Handles both button-based and URL parameter pagination

**Alternatives Considered**:

- **Separate pagination logic per scraper**: Code duplication
- **Hard-coded page limits**: Inflexible, may miss data
- **Click-based pagination**: Brittle (requires page load between clicks)

---

## Decision 4: Prize Money Parsing Strategy

**Problem**: Russian currency format "60000 ₽" needs conversion to Decimal for database storage.

**Decision**: Regex extraction + locale-aware number parsing.

**Implementation**:

```typescript
// lib/gomafia/parsers/currency-parser.ts
export function parsePrizeMoney(text: string | null): number | null {
  if (!text || text.trim() === '' || text === '–' || text === '-') {
    return null;
  }

  // Remove all non-numeric characters except decimal separators
  // Russian format may use space as thousands separator: "60 000 ₽"
  const cleaned = text
    .replace(/[^\d.,]/g, '') // Keep only digits, commas, periods
    .replace(/\s/g, '') // Remove spaces
    .replace(/,/g, '.'); // Normalize decimal separator

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid prize money format: "${text}"`);
  }

  return parsed;
}

// Examples:
// "60000 ₽" → 60000.00
// "60 000 ₽" → 60000.00
// "1 500,50 ₽" → 1500.50
// "–" → null
// "" → null
```

**Rationale**:

- Handles Russian formatting conventions (spaces, Cyrillic)
- Robust to variations in spacing and punctuation
- Validates result (non-negative numbers only)
- Returns null for empty/missing values (nullable field in schema)

**Alternatives Considered**:

- **Intl.NumberFormat with locale**: Overly complex for parsing (designed for formatting)
- **Simple parseInt**: Loses decimal precision
- **Direct regex capture**: Fragile to format variations

**Test Cases**:

```typescript
expect(parsePrizeMoney('60000 ₽')).toBe(60000.0);
expect(parsePrizeMoney('60 000 ₽')).toBe(60000.0);
expect(parsePrizeMoney('1 500,50 ₽')).toBe(1500.5);
expect(parsePrizeMoney('–')).toBeNull();
expect(parsePrizeMoney('')).toBeNull();
expect(() => parsePrizeMoney('invalid')).toThrow();
```

---

## Decision 5: Region Name Normalization

**Problem**: Region names may vary between endpoints (abbreviations, full names, Russian/English).

**Decision**: Maintain canonical mapping dictionary with fallback to original value.

**Implementation**:

```typescript
// lib/gomafia/parsers/region-normalizer.ts
const REGION_CANONICAL_MAP: Record<string, string> = {
  // Russian variants
  Москва: 'Москва',
  МСК: 'Москва',
  Moscow: 'Москва',

  'Санкт-Петербург': 'Санкт-Петербург',
  СПб: 'Санкт-Петербург',
  Питер: 'Санкт-Петербург',
  'Saint Petersburg': 'Санкт-Петербург',
  'St. Petersburg': 'Санкт-Петербург',

  'Нижний Новгород': 'Нижний Новгород',
  'Н.Новгород': 'Нижний Новгород',
  'Nizhny Novgorod': 'Нижний Новгород',

  // Add more as discovered during implementation
};

export function normalizeRegion(region: string | null): string | null {
  if (!region || region.trim() === '') {
    return null;
  }

  const trimmed = region.trim();

  // Check canonical map
  if (REGION_CANONICAL_MAP[trimmed]) {
    return REGION_CANONICAL_MAP[trimmed];
  }

  // Fallback: return original (log warning for analysis)
  console.warn(`Unknown region variant: "${trimmed}" - storing as-is`);
  return trimmed;
}
```

**Rationale**:

- Consistent region values across database
- Extensible (add new mappings as discovered)
- Preserves original for unknown regions (no data loss)
- Logging enables iterative improvement

**Alternatives Considered**:

- **Case-insensitive exact match**: Misses abbreviations
- **Fuzzy matching (Levenshtein)**: Overkill, may introduce errors
- **API lookup for canonical names**: External dependency, adds latency

**Maintenance Strategy**:

- Monitor warning logs during initial imports
- Update REGION_CANONICAL_MAP as new variants discovered
- Periodically query database for unique region values to identify outliers

---

## Decision 6: Year Iteration Stopping Criteria

**Problem**: Need to know when to stop iterating through historical years when scraping player stats.

**Decision**: Stop after 2 consecutive years with no data (as clarified in spec).

**Implementation**:

```typescript
// lib/gomafia/scrapers/player-stats-scraper.ts
async function scrapeAllYearStats(
  page: Page,
  gomafiaId: string
): Promise<PlayerYearStatsData[]> {
  const currentYear = new Date().getFullYear();
  const allStats: PlayerYearStatsData[] = [];
  let consecutiveEmptyYears = 0;

  for (let year = currentYear; year >= 2020; year--) {
    try {
      const stats = await scrapePlayerYearStats(page, gomafiaId, year);

      if (stats.totalGames === 0) {
        consecutiveEmptyYears++;

        // Stop if 2 consecutive years with no data
        if (consecutiveEmptyYears >= 2) {
          console.log(
            `Stopping year iteration for player ${gomafiaId} at year ${year} (2 consecutive empty years)`
          );
          break;
        }
      } else {
        // Reset counter if data found
        consecutiveEmptyYears = 0;
        allStats.push(stats);
      }
    } catch (error) {
      console.error(
        `Failed to scrape year ${year} for player ${gomafiaId}:`,
        error
      );
      // Don't count errors as empty years
      continue;
    }
  }

  return allStats;
}
```

**Rationale**:

- Handles players with gaps (e.g., played 2025, 2024, skipped 2023, played 2022)
- Avoids unnecessary API calls for players who haven't played in years
- Reasonable cutoff (2 years) balances thoroughness and efficiency
- Minimum year (2020) provides safety limit

**Edge Cases Handled**:

- Player active 2025, 2024, inactive 2023, 2022 → stops at 2022 (2 consecutive empty)
- Player active only in 2025 → stops after checking 2024, 2023 (2 consecutive empty)
- Scraping errors don't count as empty years (preserves data integrity)

**Alternatives Considered**:

- **Stop after 1 empty year**: Too aggressive, misses players with gaps
- **Fixed cutoff year (2020)**: Wastes API calls for newer players
- **Stop after 3+ consecutive empty**: Too many unnecessary calls

---

## Decision 7: Checkpoint Serialization Format

**Problem**: Need to store checkpoint data in SyncStatus.currentOperation for resume capability.

**Decision**: JSON serialization with structured checkpoint interface.

**Implementation**:

```typescript
// lib/gomafia/import/checkpoint-manager.ts
export interface ImportCheckpoint {
  phase:
    | 'CLUBS'
    | 'PLAYERS'
    | 'PLAYER_YEAR_STATS'
    | 'TOURNAMENTS'
    | 'PLAYER_TOURNAMENT_HISTORY'
    | 'GAMES'
    | 'STATISTICS';
  lastBatchIndex: number;
  totalBatches: number;
  processedIds: string[]; // gomafiaIds processed in current batch
  phaseMetadata?: {
    // Phase-specific data
    [key: string]: any;
  };
  message: string; // Human-readable progress message
  timestamp: string; // ISO 8601 timestamp
}

export class CheckpointManager {
  constructor(private db: PrismaClient) {}

  async saveCheckpoint(checkpoint: ImportCheckpoint): Promise<void> {
    await this.db.syncStatus.upsert({
      where: { id: 'current' },
      update: {
        currentOperation: JSON.stringify(checkpoint),
        progress: Math.floor(
          (checkpoint.lastBatchIndex / checkpoint.totalBatches) * 100
        ),
        updatedAt: new Date(),
      },
      create: {
        id: 'current',
        isRunning: true,
        currentOperation: JSON.stringify(checkpoint),
        progress: 0,
      },
    });
  }

  async loadCheckpoint(): Promise<ImportCheckpoint | null> {
    const status = await this.db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    if (!status?.currentOperation) {
      return null;
    }

    try {
      return JSON.parse(status.currentOperation) as ImportCheckpoint;
    } catch (error) {
      console.error('Failed to parse checkpoint:', error);
      return null;
    }
  }

  async clearCheckpoint(): Promise<void> {
    await this.db.syncStatus.update({
      where: { id: 'current' },
      data: {
        currentOperation: null,
        progress: 0,
        isRunning: false,
      },
    });
  }
}

// Example checkpoint
const checkpoint: ImportCheckpoint = {
  phase: 'PLAYERS',
  lastBatchIndex: 15,
  totalBatches: 50,
  processedIds: ['player-1', 'player-2', 'player-3' /* ... */],
  phaseMetadata: {
    regionsProcessed: ['Москва', 'Санкт-Петербург'],
    currentRegion: 'Казань',
  },
  message: 'Importing players: batch 15/50 (Казань region)',
  timestamp: '2025-10-26T14:30:00Z',
};
```

**Rationale**:

- Structured format enables programmatic resume logic
- Human-readable message for UI display
- Phase-specific metadata supports complex resume scenarios
- Timestamp enables timeout detection (12-hour limit)
- processedIds array enables deduplication on resume

**Alternatives Considered**:

- **Binary serialization (Protocol Buffers)**: Overkill, harder to debug
- **Separate checkpoint table**: Additional schema complexity
- **File-based checkpoint**: Not viable in serverless/cloud environments

**Resume Logic**:

```typescript
async function resumeImport() {
  const checkpoint = await checkpointManager.loadCheckpoint();

  if (!checkpoint) {
    // Start from beginning
    return startFreshImport();
  }

  // Check if timeout exceeded (12 hours)
  const elapsed = Date.now() - new Date(checkpoint.timestamp).getTime();
  if (elapsed > 12 * 60 * 60 * 1000) {
    throw new Error('Import timeout exceeded (12 hours)');
  }

  // Resume from last batch + 1
  return continueImport({
    phase: checkpoint.phase,
    startBatchIndex: checkpoint.lastBatchIndex + 1,
    skipIds: checkpoint.processedIds,
  });
}
```

---

## Decision 8: Playwright Stability Best Practices

**Problem**: Playwright tests can be flaky with dynamic content and network requests.

**Decision**: Implement robust wait strategies, retry logic, and error handling patterns.

**Best Practices**:

### 1. Always Use Explicit Waits

```typescript
// ❌ Bad: No wait
await page.click('button');
const text = await page.textContent('.result');

// ✅ Good: Wait for element
await page.click('button');
await page.waitForSelector('.result', { state: 'visible' });
const text = await page.textContent('.result');
```

### 2. Combine Multiple Wait Strategies

```typescript
// Wait for network + DOM
await Promise.all([
  page.waitForLoadState('networkidle'),
  page.waitForSelector('.data-loaded-indicator'),
]);
```

### 3. Implement Retry Logic

```typescript
async function scrapeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
        );
      }
    }
  }

  throw lastError!;
}
```

### 4. Graceful Degradation for Optional Data

```typescript
// Don't fail entire scrape if optional field missing
const optionalField = await page
  .textContent('.optional-field')
  .catch(() => null);
```

### 5. Timeout Configuration

```typescript
// Set reasonable timeouts
const page = await context.newPage();
page.setDefaultTimeout(30000); // 30 seconds for most operations
page.setDefaultNavigationTimeout(60000); // 60 seconds for navigation
```

### 6. Error Context Logging

```typescript
try {
  await page.goto(url);
} catch (error) {
  // Log context for debugging
  console.error('Navigation failed', {
    url,
    error: error.message,
    timestamp: new Date().toISOString(),
  });
  throw error;
}
```

### 7. Screenshot on Failure (for debugging)

```typescript
try {
  await scrapePage(page);
} catch (error) {
  await page.screenshot({ path: `error-${Date.now()}.png` });
  throw error;
}
```

**Rationale**:

- Reduces flakiness in E2E tests
- Makes scraping more resilient to gomafia.pro variations
- Provides better error diagnostics
- Aligns with Playwright official recommendations

**References**:

- Playwright Best Practices: https://playwright.dev/docs/best-practices
- Auto-waiting: https://playwright.dev/docs/actionability

---

## Summary of Decisions

| #   | Area                 | Decision                         | Impact                       |
| --- | -------------------- | -------------------------------- | ---------------------------- |
| 1   | Concurrency Control  | PostgreSQL advisory locks        | Multi-instance safety        |
| 2   | Dynamic Content      | `networkidle` + selector wait    | Reliable year stats scraping |
| 3   | Pagination           | Generic reusable handler         | DRY across 8 endpoints       |
| 4   | Prize Parsing        | Regex + locale-aware parsing     | Handles Russian formatting   |
| 5   | Region Normalization | Canonical mapping dictionary     | Consistent data quality      |
| 6   | Year Iteration       | Stop after 2 consecutive empty   | Optimized API efficiency     |
| 7   | Checkpointing        | JSON serialization in SyncStatus | Resume capability            |
| 8   | Playwright Stability | Explicit waits + retry logic     | Reduced flakiness            |

All research complete. Ready to proceed to Phase 1 contracts and quickstart generation.
