# Manual Retry Guide for Skipped Pages

This guide explains how to manually retry pages that were skipped during the import process (e.g., page 796).

## Method 1: Using the Script (Recommended) ⭐

The easiest way is to use the provided script:

```bash
# Make sure tsx is installed (if not already):
npm install -g tsx
# OR use locally:
yarn add -D tsx

# Retry a single page (e.g., page 796 for players)
npx tsx scripts/retry-skipped-pages.ts players 796

# Retry multiple pages
npx tsx scripts/retry-skipped-pages.ts players 796 850 920

# Retry clubs
npx tsx scripts/retry-skipped-pages.ts clubs 10 15

# Retry tournaments
npx tsx scripts/retry-skipped-pages.ts tournaments 5 8
```

**Quick Example for page 796:**

```bash
cd /Users/k05m0navt/Programming/PetProjects/Web/mafia-insight
npx tsx scripts/retry-skipped-pages.ts players 796
```

## Method 2: Using Node.js REPL

You can also use Node.js REPL for interactive retrying:

```bash
# Start Node.js REPL
node

# Then in the REPL:
```

```javascript
const { chromium } = require('playwright');
const {
  PlayersScraper,
} = require('./src/lib/gomafia/scrapers/players-scraper');
const { RateLimiter } = require('./src/lib/gomafia/import/rate-limiter');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const rateLimiter = new RateLimiter(2000);
  const scraper = new PlayersScraper(page, rateLimiter);

  // Retry page 796
  const result = await scraper.retrySkippedPages([796], {
    year: 2025,
    region: 'all',
  });

  console.log(`Retrieved ${result.length} players`);
  await browser.close();
})();
```

## Method 3: Creating a Custom API Endpoint

You can create a new API endpoint for manual retries:

```typescript
// src/app/api/admin/import/retry/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { PlayersScraper } from '@/lib/gomafia/scrapers/players-scraper';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';

export async function POST(request: NextRequest) {
  const { entityType, pageNumbers } = await request.json();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const rateLimiter = new RateLimiter(2000);

  try {
    let scraper;
    switch (entityType) {
      case 'players':
        scraper = new PlayersScraper(page, rateLimiter);
        break;
      // Add clubs and tournaments...
    }

    const result = await scraper.retrySkippedPages(pageNumbers, {
      year: new Date().getFullYear(),
      region: 'all',
    });

    return NextResponse.json({
      success: true,
      retriedCount: result.length,
      pages: pageNumbers,
    });
  } finally {
    await browser.close();
  }
}
```

Then call it:

```bash
curl -X POST http://localhost:3000/api/admin/import/retry \
  -H "Content-Type: application/json" \
  -d '{"entityType": "players", "pageNumbers": [796]}'
```

## Method 4: Direct Code Usage in Your Application

If you need to integrate retry logic into your application:

```typescript
import { chromium } from 'playwright';
import { PlayersScraper } from '@/lib/gomafia/scrapers/players-scraper';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';
import { resilientDB } from '@/lib/db-resilient';

async function retryPlayersPage(pageNumber: number) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const rateLimiter = new RateLimiter(2000);
  const scraper = new PlayersScraper(page, rateLimiter);

  try {
    // Retry the skipped page
    const retriedPlayers = await scraper.retrySkippedPages([pageNumber], {
      year: new Date().getFullYear(),
      region: 'all',
      onPageData: async (pageNum, pageData) => {
        // Save data incrementally as we retry
        // This is similar to what happens during normal import
        console.log(
          `Saving ${pageData.length} players from page ${pageNum}...`
        );

        // You can add your saving logic here
        // For example, similar to PlayersPhase.savePageData()
      },
    });

    console.log(`Successfully retried ${retriedPlayers.length} players`);
    return retriedPlayers;
  } finally {
    await browser.close();
  }
}

// Usage
await retryPlayersPage(796);
```

## Understanding Skipped Pages

Skipped pages occur when:

- A page times out after multiple retry attempts
- Network errors prevent page loading
- The page returns no data after retries

The system automatically:

1. **Detects** skipped pages during scraping
2. **Logs** them: `[Pagination] Skipped 1 pages: 796`
3. **Returns** them in the result: `{ data: [...], skippedPages: [796] }`
4. **Auto-retries** them if there are ≤5 skipped pages

## Manual Retry Use Cases

You might want to manually retry when:

- **Many pages were skipped** (>5) - auto-retry is disabled for performance
- **Specific page failed** - you want to retry just that one
- **After network issues resolved** - retry pages that failed due to transient issues
- **Data verification** - verify that specific pages can now be scraped

## Tips

1. **Check logs first**: Look for `[Pagination] Skipped X pages: ...` in your import logs
2. **Retry reasonable batches**: Don't retry 100+ pages at once - do them in batches
3. **Monitor resources**: Retrying uses browser resources - don't overload the system
4. **Save incrementally**: Use `onPageData` callback to save data as you retry

## Example: Retry Page 796 for Players

```bash
# Using the script
npx tsx scripts/retry-skipped-pages.ts players 796

# Expected output:
# 🔄 Retrying 1 skipped pages for players...
#    Pages: 796
#
# [Pagination] Retrying 1 skipped pages: 796
# [Pagination] Successfully retried page 796: 10 records
# [Pagination] Retry complete: 10 records from 1 pages
# ✅ Successfully retried 10 players from 1 pages
#
# ✨ Retry complete!
```
