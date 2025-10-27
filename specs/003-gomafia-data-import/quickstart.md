# Quickstart: GoMafia Initial Data Import

**Feature**: 003-gomafia-data-import  
**Date**: October 26, 2025  
**Purpose**: TDD implementation guide for comprehensive gomafia.pro data import

## Overview

This guide provides a test-first implementation workflow for the GoMafia Initial Data Import feature. Follow the phases in order, writing tests before implementation (Red-Green-Refactor cycle).

**Estimated Timeline**: 6-10 weeks (single developer, following TDD)

---

## Prerequisites

1. **Schema Migration Applied**:

```bash
cd /Users/k05m0navt/Programming/PetProjects/Web/mafia-insight
npx prisma migrate dev --name add_comprehensive_gomafia_import_schema
npx prisma generate
```

2. **Test Database Setup**:

```bash
./scripts/setup-test-db.sh
```

3. **Dependencies Installed**:

```bash
yarn install
```

---

## Phase 1: Core Infrastructure (Week 1-2)

### 1.1 Advisory Lock Manager

**Test First** (`tests/unit/advisory-lock.test.ts`):

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AdvisoryLockManager } from '@/lib/gomafia/import/advisory-lock';

describe('AdvisoryLockManager', () => {
  let db: PrismaClient;
  let lockManager: AdvisoryLockManager;

  beforeEach(() => {
    db = new PrismaClient();
    lockManager = new AdvisoryLockManager(db);
  });

  afterEach(async () => {
    await db.$disconnect();
  });

  it('should acquire lock when not held', async () => {
    const acquired = await lockManager.acquireLock();
    expect(acquired).toBe(true);
    await lockManager.releaseLock();
  });

  it('should fail to acquire when already held', async () => {
    const firstAcquire = await lockManager.acquireLock();
    expect(firstAcquire).toBe(true);

    const secondAcquire = await lockManager.acquireLock();
    expect(secondAcquire).toBe(false);

    await lockManager.releaseLock();
  });

  it('should execute function with lock protection', async () => {
    const result = await lockManager.withLock(async () => {
      return 'success';
    });
    expect(result).toBe('success');
  });

  it('should release lock even if function throws', async () => {
    await expect(async () => {
      await lockManager.withLock(async () => {
        throw new Error('Test error');
      });
    }).rejects.toThrow('Test error');

    // Verify lock is released
    const canAcquire = await lockManager.acquireLock();
    expect(canAcquire).toBe(true);
    await lockManager.releaseLock();
  });
});
```

**Implement** (`src/lib/gomafia/import/advisory-lock.ts`):

```typescript
import { PrismaClient } from '@prisma/client';

const IMPORT_LOCK_ID = 123456789;

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

**Verify**:

```bash
yarn test tests/unit/advisory-lock.test.ts
```

---

### 1.2 Rate Limiter

**Test First** (`tests/unit/rate-limiter.test.ts`):

```typescript
import { describe, it, expect, vi } from 'vitest';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';

describe('RateLimiter', () => {
  it('should enforce minimum delay between calls', async () => {
    const limiter = new RateLimiter(100); // 100ms for testing

    const start = Date.now();
    await limiter.wait();
    await limiter.wait();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it('should track request count', async () => {
    const limiter = new RateLimiter(10);

    await limiter.wait();
    await limiter.wait();

    expect(limiter.getRequestCount()).toBe(2);
  });

  it('should calculate average delay', async () => {
    const limiter = new RateLimiter(50);

    await limiter.wait();
    await limiter.wait();

    const avgDelay = limiter.getAverageDelay();
    expect(avgDelay).toBeGreaterThan(0);
    expect(avgDelay).toBeLessThan(100); // Should be close to 50ms
  });
});
```

**Implement** (`src/lib/gomafia/import/rate-limiter.ts`):

```typescript
export class RateLimiter {
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private totalDelay: number = 0;

  constructor(private minDelayMs: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay = Math.max(0, this.minDelayMs - timeSinceLastRequest);

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      this.totalDelay += delay;
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  getAverageDelay(): number {
    return this.requestCount > 0 ? this.totalDelay / this.requestCount : 0;
  }

  reset(): void {
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.totalDelay = 0;
  }
}
```

---

### 1.3 Checkpoint Manager

**Test First** (`tests/unit/checkpoint-manager.test.ts`):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  CheckpointManager,
  ImportCheckpoint,
} from '@/lib/gomafia/import/checkpoint-manager';

describe('CheckpointManager', () => {
  let db: PrismaClient;
  let checkpointManager: CheckpointManager;

  beforeEach(async () => {
    db = new PrismaClient();
    checkpointManager = new CheckpointManager(db);

    // Clear any existing checkpoint
    await db.syncStatus.upsert({
      where: { id: 'current' },
      update: { currentOperation: null, isRunning: false, progress: 0 },
      create: { id: 'current', isRunning: false, progress: 0 },
    });
  });

  it('should save and load checkpoint', async () => {
    const checkpoint: ImportCheckpoint = {
      phase: 'PLAYERS',
      lastBatchIndex: 10,
      totalBatches: 50,
      processedIds: ['player-1', 'player-2'],
      message: 'Importing players: batch 10/50',
      timestamp: new Date().toISOString(),
    };

    await checkpointManager.saveCheckpoint(checkpoint);
    const loaded = await checkpointManager.loadCheckpoint();

    expect(loaded).toEqual(checkpoint);
  });

  it('should return null when no checkpoint exists', async () => {
    const loaded = await checkpointManager.loadCheckpoint();
    expect(loaded).toBeNull();
  });

  it('should clear checkpoint', async () => {
    const checkpoint: ImportCheckpoint = {
      phase: 'GAMES',
      lastBatchIndex: 5,
      totalBatches: 20,
      processedIds: ['game-1'],
      message: 'Importing games',
      timestamp: new Date().toISOString(),
    };

    await checkpointManager.saveCheckpoint(checkpoint);
    await checkpointManager.clearCheckpoint();

    const loaded = await checkpointManager.loadCheckpoint();
    expect(loaded).toBeNull();
  });

  it('should update progress percentage', async () => {
    const checkpoint: ImportCheckpoint = {
      phase: 'PLAYERS',
      lastBatchIndex: 25,
      totalBatches: 50,
      processedIds: [],
      message: 'Half complete',
      timestamp: new Date().toISOString(),
    };

    await checkpointManager.saveCheckpoint(checkpoint);

    const status = await db.syncStatus.findUnique({ where: { id: 'current' } });
    expect(status?.progress).toBe(50); // 25/50 = 50%
  });
});
```

**Implement** (`src/lib/gomafia/import/checkpoint-manager.ts`):

```typescript
import { PrismaClient } from '@prisma/client';

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
  processedIds: string[];
  phaseMetadata?: Record<string, any>;
  message: string;
  timestamp: string;
}

export class CheckpointManager {
  constructor(private db: PrismaClient) {}

  async saveCheckpoint(checkpoint: ImportCheckpoint): Promise<void> {
    const progress = Math.floor(
      (checkpoint.lastBatchIndex / checkpoint.totalBatches) * 100
    );

    await this.db.syncStatus.upsert({
      where: { id: 'current' },
      update: {
        currentOperation: JSON.stringify(checkpoint),
        progress,
        updatedAt: new Date(),
      },
      create: {
        id: 'current',
        isRunning: true,
        currentOperation: JSON.stringify(checkpoint),
        progress,
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
```

---

## Phase 2: Scrapers & Parsers (Week 3-5)

### 2.1 Players List Scraper

**Test First** (`tests/unit/scrapers/players-scraper.test.ts`):

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { PlayersScraper } from '@/lib/gomafia/scrapers/players-scraper';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';

describe('PlayersScraper', () => {
  let browser: Browser;
  let page: Page;
  let rateLimiter: RateLimiter;
  let scraper: PlayersScraper;

  beforeEach(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    rateLimiter = new RateLimiter(100); // Fast for testing
    scraper = new PlayersScraper(page, rateLimiter);
  });

  afterEach(async () => {
    await browser.close();
  });

  it('should scrape players from single page', async () => {
    // Mock page content or use real endpoint for integration test
    const players = await scraper.scrapePage({
      url: 'https://gomafia.pro/rating?yearUsers=2025&regionUsers=all&pageUsers=1',
    });

    expect(players).toBeInstanceOf(Array);
    expect(players.length).toBeGreaterThan(0);

    // Validate player structure
    players.forEach((player) => {
      expect(player).toHaveProperty('name');
      expect(player).toHaveProperty('gomafiaId');
      expect(player).toHaveProperty('region');
    });
  });

  it('should handle pagination', async () => {
    const allPlayers = await scraper.scrapeAllPages({
      baseUrl: 'https://gomafia.pro/rating?yearUsers=2025&regionUsers=all',
      maxPages: 2, // Limit for testing
    });

    expect(allPlayers.length).toBeGreaterThan(0);
  });

  it('should respect rate limiting', async () => {
    const start = Date.now();

    await scraper.scrapePage({ url: 'https://gomafia.pro/rating' });
    await scraper.scrapePage({ url: 'https://gomafia.pro/rating?pageUsers=2' });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100); // Rate limit enforced
  });
});
```

**Implement** (`src/lib/gomafia/scrapers/players-scraper.ts`):

```typescript
import { Page } from 'playwright';
import { RateLimiter } from '../import/rate-limiter';
import { PlayerRawData } from '@/types/gomafia-entities';

export class PlayersScraper {
  constructor(
    private page: Page,
    private rateLimiter: RateLimiter
  ) {}

  async scrapePage(config: { url: string }): Promise<PlayerRawData[]> {
    await this.page.goto(config.url);
    await this.rateLimiter.wait();

    // Wait for table to load
    await this.page.waitForSelector('table tbody tr', { timeout: 10000 });

    const players = await this.page.$$eval('table tbody tr', (rows) =>
      rows.map((row) => ({
        name: row.querySelector('.player-name')?.textContent?.trim() || '',
        gomafiaId: row.querySelector('a')?.href?.split('/').pop() || '',
        region: row.querySelector('.region')?.textContent?.trim() || null,
        club: row.querySelector('.club-name')?.textContent?.trim() || null,
        tournaments: parseInt(
          row.querySelector('.tournaments')?.textContent?.trim() || '0'
        ),
        ggPoints: parseInt(
          row.querySelector('.gg-points')?.textContent?.trim() || '0'
        ),
        elo: parseFloat(row.querySelector('.elo')?.textContent?.trim() || '0'),
      }))
    );

    return players;
  }

  async scrapeAllPages(config: {
    baseUrl: string;
    maxPages?: number;
  }): Promise<PlayerRawData[]> {
    const allPlayers: PlayerRawData[] = [];
    let currentPage = 1;
    const maxPages = config.maxPages || Infinity;

    while (currentPage <= maxPages) {
      const url = `${config.baseUrl}${config.baseUrl.includes('?') ? '&' : '?'}pageUsers=${currentPage}`;
      const pageData = await this.scrapePage({ url });

      if (pageData.length === 0) {
        break; // No more data
      }

      allPlayers.push(...pageData);

      // Check for next page button
      const hasNext = await this.page.$('.pagination .next:not(.disabled)');
      if (!hasNext) {
        break;
      }

      currentPage++;
    }

    return allPlayers;
  }
}
```

---

### 2.2 Year Stats Scraper (Dynamic Content)

**Test First** (`tests/unit/scrapers/player-stats-scraper.test.ts`):

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { PlayerStatsScraper } from '@/lib/gomafia/scrapers/player-stats-scraper';

describe('PlayerStatsScraper', () => {
  let browser: Browser;
  let page: Page;
  let scraper: PlayerStatsScraper;

  beforeEach(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    scraper = new PlayerStatsScraper(page);
  });

  afterEach(async () => {
    await browser.close();
  });

  it('should scrape year stats with dynamic loading', async () => {
    const stats = await scraper.scrapeYearStats({
      gomafiaId: '575',
      year: 2025,
    });

    expect(stats).toHaveProperty('year', 2025);
    expect(stats).toHaveProperty('totalGames');
    expect(stats).toHaveProperty('donGames');
    expect(stats).toHaveProperty('mafiaGames');
    expect(stats).toHaveProperty('sheriffGames');
    expect(stats).toHaveProperty('civilianGames');
    expect(stats).toHaveProperty('eloRating');
  });

  it('should handle multiple years', async () => {
    const allStats = await scraper.scrapeAllYears({
      gomafiaId: '575',
    });

    expect(allStats.length).toBeGreaterThan(0);

    // Should stop after 2 consecutive empty years
    const lastYear = allStats[allStats.length - 1].year;
    expect(lastYear).toBeGreaterThanOrEqual(2020);
  });

  it('should wait for dynamic content to load', async () => {
    // This test verifies networkidle wait works
    const stats = await scraper.scrapeYearStats({
      gomafiaId: '575',
      year: 2024,
    });

    // Data should be complete (not partial/loading state)
    expect(stats.totalGames).toBeGreaterThan(0);
  });
});
```

**Implement** (`src/lib/gomafia/scrapers/player-stats-scraper.ts`):

```typescript
import { Page } from 'playwright';
import { PlayerYearStatsRawData } from '@/types/gomafia-entities';

export class PlayerStatsScraper {
  constructor(private page: Page) {}

  async scrapeYearStats(config: {
    gomafiaId: string;
    year: number;
  }): Promise<PlayerYearStatsRawData> {
    await this.page.goto(`https://gomafia.pro/stats/${config.gomafiaId}`);

    // Click year selector
    await this.page.click(`button:has-text("${config.year}")`);

    // Wait for dynamic content
    await Promise.race([
      this.page.waitForLoadState('networkidle', { timeout: 10000 }),
      new Promise((resolve) => setTimeout(resolve, 5000)), // Fallback
    ]);

    // Wait for data element
    await this.page.waitForSelector('.total-games', { timeout: 5000 });

    // Extract data
    const data = await this.page.evaluate(() => {
      const getText = (selector: string) =>
        document.querySelector(selector)?.textContent?.trim() || '0';

      return {
        totalGames: parseInt(getText('.total-games')),
        donGames: parseInt(getText('.don-games')),
        mafiaGames: parseInt(getText('.mafia-games')),
        sheriffGames: parseInt(getText('.sheriff-games')),
        civilianGames: parseInt(getText('.civilian-games')),
        eloRating: parseFloat(getText('.elo-rating')),
        extraPoints: parseFloat(getText('.extra-points')),
      };
    });

    return {
      year: config.year,
      ...data,
    };
  }

  async scrapeAllYears(config: {
    gomafiaId: string;
  }): Promise<PlayerYearStatsRawData[]> {
    const currentYear = new Date().getFullYear();
    const allStats: PlayerYearStatsRawData[] = [];
    let consecutiveEmptyYears = 0;

    for (let year = currentYear; year >= 2020; year--) {
      try {
        const stats = await this.scrapeYearStats({
          gomafiaId: config.gomafiaId,
          year,
        });

        if (stats.totalGames === 0) {
          consecutiveEmptyYears++;
          if (consecutiveEmptyYears >= 2) {
            break; // Stop after 2 consecutive empty years
          }
        } else {
          consecutiveEmptyYears = 0;
          allStats.push(stats);
        }
      } catch (error) {
        console.error(`Failed to scrape year ${year}:`, error);
      }
    }

    return allStats;
  }
}
```

---

## Phase 3: API Endpoints (Week 6)

### 3.1 Import Trigger Endpoint

**Test First** (`tests/integration/api-import-endpoints.test.ts`):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { testApiHandler } from 'next-test-api-route-handler';
import * as importRoute from '@/app/api/gomafia-sync/import/route';

describe('POST /api/gomafia-sync/import', () => {
  it('should trigger import successfully', async () => {
    await testApiHandler({
      handler: importRoute.POST,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST' });
        const data = await res.json();

        expect(res.status).toBe(202);
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('syncLogId');
      },
    });
  });

  it('should return 409 if import already running', async () => {
    // First request
    await testApiHandler({
      handler: importRoute.POST,
      test: async ({ fetch }) => {
        await fetch({ method: 'POST' });
      },
    });

    // Second request should fail
    await testApiHandler({
      handler: importRoute.POST,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST' });
        const data = await res.json();

        expect(res.status).toBe(409);
        expect(data.code).toBe('IMPORT_RUNNING');
      },
    });
  });
});
```

**Implement** (`src/app/api/gomafia-sync/import/route.ts`):

```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AdvisoryLockManager } from '@/lib/gomafia/import/advisory-lock';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';

const db = new PrismaClient();

export async function POST(request: Request) {
  const lockManager = new AdvisoryLockManager(db);

  try {
    const acquired = await lockManager.acquireLock();

    if (!acquired) {
      return NextResponse.json(
        {
          error: 'Import operation already in progress',
          code: 'IMPORT_RUNNING',
        },
        { status: 409 }
      );
    }

    // Start import asynchronously
    const orchestrator = new ImportOrchestrator(db);
    const syncLogId = await orchestrator.start();

    return NextResponse.json(
      {
        success: true,
        message: 'Initial import started successfully',
        syncLogId,
        estimatedDuration: '3-4 hours',
      },
      { status: 202 }
    );
  } catch (error) {
    await lockManager.releaseLock();
    console.error('Import trigger failed:', error);
    return NextResponse.json(
      { error: 'Failed to trigger import', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

---

## Phase 4: E2E Tests (Week 7-8)

### 4.1 Complete Import Flow

**Test** (`tests/e2e/import-flow.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';

test.describe('Import Flow E2E', () => {
  test('should trigger import and show progress', async ({ page }) => {
    await page.goto('http://localhost:3000/sync');

    // Click trigger button
    await page.click('button:has-text("Start Import")');

    // Wait for progress to appear
    await page.waitForSelector('[data-testid="import-progress"]', {
      timeout: 5000,
    });

    // Verify progress updates
    const progress = page.locator('[data-testid="progress-percentage"]');
    await expect(progress).toBeVisible();

    // Check progress increases
    const initialProgress = await progress.textContent();
    await page.waitForTimeout(5000); // Wait for progress
    const updatedProgress = await progress.textContent();

    expect(parseInt(updatedProgress || '0')).toBeGreaterThan(
      parseInt(initialProgress || '0')
    );
  });

  test('should handle resume after interruption', async ({ page }) => {
    await page.goto('http://localhost:3000/sync');

    // Start import
    await page.click('button:has-text("Start Import")');
    await page.waitForSelector('[data-testid="import-progress"]');

    // Simulate interruption (refresh page)
    await page.reload();

    // Click resume
    await page.click('button:has-text("Resume Import")');

    // Verify import continues
    const progress = page.locator('[data-testid="progress-percentage"]');
    await expect(progress).toBeVisible();
  });
});
```

---

## Verification Checklist

After completing all phases:

- [ ] All unit tests pass (`yarn test`)
- [ ] All integration tests pass
- [ ] All E2E tests pass (`yarn test:e2e`)
- [ ] Test coverage >80% (`yarn test:coverage`)
- [ ] Linting passes (`yarn lint`)
- [ ] Type checking passes (`yarn type-check`)
- [ ] Schema migration applied successfully
- [ ] Manual smoke test: Import completes for sample data
- [ ] Manual test: Progress updates every 2 seconds
- [ ] Manual test: Import can be cancelled
- [ ] Manual test: Import resumes from checkpoint
- [ ] Manual test: Advisory lock prevents concurrent imports

---

## Troubleshooting

### Issue: Advisory Lock Not Released

**Symptom**: Can't start new import, lock seems stuck  
**Solution**:

```sql
-- Manually release lock in PostgreSQL
SELECT pg_advisory_unlock_all();
```

### Issue: Playwright Tests Timeout

**Symptom**: Year stats scraping times out  
**Solution**:

- Increase timeout in test config
- Check network connectivity to gomafia.pro
- Verify wait strategies (networkidle + selector)

### Issue: Rate Limiting Too Aggressive

**Symptom**: Import takes >12 hours  
**Solution**:

- Review rate limiter configuration (should be 2000ms)
- Check for unnecessary duplicate requests
- Optimize pagination (don't re-scrape same pages)

### Issue: Checkpoint Not Loading

**Symptom**: Import always starts from beginning  
**Solution**:

- Verify SyncStatus record exists with id='current'
- Check JSON parsing in CheckpointManager
- Validate checkpoint structure matches interface

---

## Next Steps

After completing implementation:

1. Run full test suite
2. Perform manual testing with real gomafia.pro data
3. Monitor first production import for issues
4. Iterate on error handling based on real-world edge cases
5. Optimize batch size if performance issues arise

**Documentation**: Update README with import feature usage instructions.
