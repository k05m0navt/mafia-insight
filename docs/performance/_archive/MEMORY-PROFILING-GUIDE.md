# Memory Profiling Guide: GoMafia Data Import

**Feature**: 003-gomafia-data-import  
**Date**: October 26, 2025  
**Purpose**: Guide for profiling memory usage during large imports and optimizing batch size

## Overview

The import feature processes large amounts of data (10,000+ players, 50,000+ games) in batches. This guide provides instructions for profiling memory usage and optimizing batch size to prevent out-of-memory (OOM) errors.

## Current Configuration

**Batch Size**: 100 records per batch  
**Estimated Memory**: ~50-100MB per 1,000 records  
**Target**: Keep peak memory <1GB for serverless deployments

## Memory Profiling Tools

### 1. Node.js Built-in Memory Profiling

#### Heap Snapshot

**Capture heap snapshot during import**:

```javascript
// Add to src/lib/gomafia/import/import-orchestrator.ts

import { writeHeapSnapshot } from 'v8';

async function runImportWithProfiling() {
  console.log('Starting import with memory profiling...');

  // Take snapshot before import
  const beforeSnapshot = writeHeapSnapshot('./heap-before-import.heapsnapshot');
  console.log(`Heap snapshot saved: ${beforeSnapshot}`);

  // Run import
  await importOrchestrator.start();

  // Take snapshot after import
  const afterSnapshot = writeHeapSnapshot('./heap-after-import.heapsnapshot');
  console.log(`Heap snapshot saved: ${afterSnapshot}`);
}
```

**Analyze snapshots**:

1. Open Chrome DevTools
2. Navigate to Memory tab
3. Load `.heapsnapshot` files
4. Compare "before" and "after" to find leaks

---

#### process.memoryUsage()

**Log memory usage at checkpoints**:

```typescript
// src/lib/gomafia/import/import-orchestrator.ts

async function importBatch(batch: any[], batchIndex: number) {
  const memBefore = process.memoryUsage();

  await db.player.createMany({ data: batch });

  const memAfter = process.memoryUsage();

  console.log(`Batch ${batchIndex} memory:`, {
    heapUsedMB: Math.round(
      (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024
    ),
    heapTotalMB: Math.round(memAfter.heapTotal / 1024 / 1024),
    rssMB: Math.round(memAfter.rss / 1024 / 1024),
    externalMB: Math.round(memAfter.external / 1024 / 1024),
  });
}
```

**Interpretation**:

- `heapUsed`: JavaScript objects in memory
- `heapTotal`: Total heap allocated by V8
- `rss`: Resident Set Size (total memory including C++ objects, V8, Playwright)
- `external`: Memory used by C++ objects bound to JS objects

---

### 2. clinic.js (Node.js Performance Profiling)

**Installation**:

```bash
npm install -g clinic
```

**Profile memory during import**:

```bash
# Profile with clinic doctor (detects memory leaks, event loop blocking)
clinic doctor -- node dist/scripts/run-import.js

# Profile with clinic heapprofiler (detailed heap usage)
clinic heapprofiler -- node dist/scripts/run-import.js

# Open generated HTML report
clinic doctor --open
```

**What to look for**:

- Memory leaks (increasing heap over time)
- Event loop delays (blocking operations)
- GC pressure (frequent garbage collection)

---

### 3. Playwright Memory Profiling

Playwright browser instances can consume significant memory (100-500MB per browser).

**Monitor browser memory**:

```typescript
// src/lib/gomafia/scrapers/base-scraper.ts

async function monitorBrowserMemory(page: Page) {
  const metrics = await page.evaluate(() => ({
    usedJSHeapSize: (performance as any).memory?.usedJSHeapSize,
    totalJSHeapSize: (performance as any).memory?.totalJSHeapSize,
    jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit,
  }));

  console.log('Browser memory:', {
    usedMB: Math.round(metrics.usedJSHeapSize / 1024 / 1024),
    totalMB: Math.round(metrics.totalJSHeapSize / 1024 / 1024),
    limitMB: Math.round(metrics.jsHeapSizeLimit / 1024 / 1024),
  });
}
```

**Close browser contexts after each phase**:

```typescript
// After completing a scraping phase
await browser.close();
await new Promise((resolve) => setTimeout(resolve, 1000)); // Let GC run
```

---

## Memory Optimization Strategies

### Strategy 1: Reduce Batch Size

**Current**: 100 records per batch  
**Problem**: Too large for serverless environments with 1GB memory limit  
**Solution**: Reduce to 50 records per batch

**Implementation**:

```typescript
// src/lib/gomafia/import/batch-processor.ts

export class BatchProcessor {
  // Change from 100 to 50
  private readonly BATCH_SIZE = 50;

  async processBatch<T>(items: T[], processFn: (batch: T[]) => Promise<void>) {
    for (let i = 0; i < items.length; i += this.BATCH_SIZE) {
      const batch = items.slice(i, i + this.BATCH_SIZE);
      await processFn(batch);

      // Force garbage collection (if --expose-gc flag used)
      if (global.gc) {
        global.gc();
      }
    }
  }
}
```

**Trade-off**: Import takes longer (more batches), but uses less memory

---

### Strategy 2: Stream Processing Instead of Batching

Instead of loading all data into memory, process items one-by-one:

```typescript
// src/lib/gomafia/import/stream-processor.ts

export class StreamProcessor {
  async processStream<T>(
    items: AsyncIterableIterator<T>,
    processFn: (item: T) => Promise<void>
  ) {
    for await (const item of items) {
      await processFn(item);

      // Item immediately eligible for GC after processing
    }
  }
}

// Usage example
async function* fetchPlayersStream() {
  let page = 1;
  while (true) {
    const players = await scraper.scrapePage(page);
    if (players.length === 0) break;

    for (const player of players) {
      yield player; // Stream one at a time
    }

    page++;
  }
}

await streamProcessor.processStream(fetchPlayersStream(), async (player) => {
  await db.player.create({ data: player });
});
```

**Benefit**: Minimal memory footprint (only 1 record in memory at a time)

---

### Strategy 3: Release Playwright Resources Aggressively

**Problem**: Playwright browser instances accumulate memory  
**Solution**: Close and reopen browser every N pages

```typescript
// src/lib/gomafia/scrapers/pagination-handler.ts

export class PaginationHandler {
  private readonly PAGES_PER_BROWSER_SESSION = 50;

  async scrapeAllPages<T>(config: PaginationConfig): Promise<T[]> {
    const allData: T[] = [];
    let currentPage = 1;
    let browser: Browser | null = null;

    while (true) {
      // Reopen browser every 50 pages
      if (currentPage % this.PAGES_PER_BROWSER_SESSION === 1) {
        if (browser) {
          await browser.close();
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Let GC run
        }
        browser = await chromium.launch();
      }

      const pageData = await this.scrapePage(browser, currentPage, config);
      if (pageData.length === 0) break;

      allData.push(...pageData);
      currentPage++;
    }

    if (browser) await browser.close();
    return allData;
  }
}
```

---

### Strategy 4: Database Query Optimization

**Problem**: Large result sets from database queries consume memory  
**Solution**: Use cursor-based pagination with Prisma

```typescript
// Instead of loading all players at once
const allPlayers = await db.player.findMany(); // BAD: Loads all into memory

// Use cursor-based pagination
async function* getPlayersCursor() {
  let cursor: string | undefined = undefined;
  const take = 100;

  while (true) {
    const players = await db.player.findMany({
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });

    if (players.length === 0) break;

    for (const player of players) {
      yield player;
    }

    cursor = players[players.length - 1].id;
  }
}
```

---

## Memory Monitoring During Import

### Real-Time Monitoring Script

Create a monitoring script that polls memory usage:

```typescript
// scripts/monitor-import-memory.ts

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function monitorMemory() {
  setInterval(async () => {
    const mem = process.memoryUsage();
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    console.log(`[${new Date().toISOString()}] Memory Status:`, {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      progress: syncStatus?.progress || 0,
      phase: syncStatus?.currentOperation
        ? JSON.parse(syncStatus.currentOperation).phase
        : 'IDLE',
    });
  }, 5000); // Log every 5 seconds
}

monitorMemory();
```

**Run alongside import**:

```bash
# Terminal 1: Run import
yarn start:import

# Terminal 2: Monitor memory
npx ts-node scripts/monitor-import-memory.ts
```

---

## Batch Size Decision Matrix

| Scenario                       | Batch Size | Reasoning                     |
| ------------------------------ | ---------- | ----------------------------- |
| **Serverless (1GB memory)**    | 25-50      | Minimize memory footprint     |
| **Container (2GB memory)**     | 50-100     | Balance speed and memory      |
| **Dedicated Server (8GB+)**    | 100-500    | Maximize throughput           |
| **Memory-constrained (512MB)** | 10-25      | Ultra-low memory              |
| **Testing/Development**        | 10         | Fast feedback, easy debugging |

---

## Performance Testing Checklist

### Before Optimization

- [ ] Profile baseline memory usage with current batch size (100)
- [ ] Identify peak memory during import
- [ ] Measure import duration for 1,000 players

### After Optimization

- [ ] Profile memory usage with new batch size
- [ ] Verify peak memory reduced by >30%
- [ ] Measure import duration (acceptable if <2x slower)
- [ ] Test with 10,000+ records to verify no OOM errors

### Load Testing

- [ ] Import 100 players (small dataset test)
- [ ] Import 1,000 players (medium dataset test)
- [ ] Import 10,000 players (large dataset test)
- [ ] Monitor memory graphs for leaks (increasing trend)

---

## Troubleshooting Memory Issues

### Symptom: OOM Error During Import

**Error**: `JavaScript heap out of memory`

**Diagnosis**:

1. Check batch size: `grep BATCH_SIZE src/lib/gomafia/import/batch-processor.ts`
2. Check import phase when OOM occurred (in logs)
3. Profile memory usage: `node --max-old-space-size=512 ...` (limit to 512MB to reproduce)

**Solutions**:

- Reduce batch size to 25-50
- Close Playwright browser more frequently
- Enable manual garbage collection: `node --expose-gc ...` and call `global.gc()`

---

### Symptom: Memory Leak (Increasing Heap Over Time)

**Diagnosis**:

1. Take heap snapshots at intervals (every 10 minutes)
2. Compare snapshots to find growing objects
3. Look for event listeners not cleaned up

**Common Causes**:

- Playwright pages not closed: `await page.close()`
- Database connections not released: `await db.$disconnect()`
- Event listeners accumulating: `page.removeAllListeners()`

**Solution**:

```typescript
// Ensure cleanup in finally block
try {
  await scraper.scrapePage();
} finally {
  await page.close();
  page.removeAllListeners();
}
```

---

### Symptom: Slow Import After N Hours

**Diagnosis**:

1. Check GC logs: `node --trace-gc ...`
2. Look for frequent full GC (indicates memory pressure)

**Solution**:

- Reduce batch size (forces more frequent GC cycles)
- Add explicit GC calls: `if (global.gc) global.gc();`
- Restart browser context periodically

---

## Recommendations

### For Production Deployment

1. **Start with batch size 50** (conservative, works on most platforms)
2. **Monitor memory for first 24 hours** (adjust if needed)
3. **Set Node.js memory limit**: `NODE_OPTIONS="--max-old-space-size=1536"` (1.5GB)
4. **Enable GC logging**: `--trace-gc` flag in production for first week
5. **Alert on high memory**: Notify if RSS >80% of available memory

### For Development

1. **Use batch size 10** for fast feedback during development
2. **Enable heap profiling**: `node --inspect` and Chrome DevTools
3. **Profile on large dataset** (10,000 records) before merging to main

---

## Appendix: Memory Profiling Checklist

- [ ] Baseline memory profile captured
- [ ] Peak memory identified (<1GB for serverless)
- [ ] Batch size optimized (50 recommended)
- [ ] Playwright cleanup verified
- [ ] Database cursor pagination tested
- [ ] Memory leak testing (6-hour import)
- [ ] Load testing with 10,000+ records
- [ ] Production monitoring configured
- [ ] GC tuning applied if needed
- [ ] Documentation updated

---

**Last Updated**: October 26, 2025  
**Prepared By**: AI Assistant  
**Next Review**: After first production import
