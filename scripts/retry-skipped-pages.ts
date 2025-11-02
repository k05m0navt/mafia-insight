/**
 * Manual script to retry skipped pages from a previous import run.
 *
 * Usage:
 *   npx tsx scripts/retry-skipped-pages.ts players 796
 *   npx tsx scripts/retry-skipped-pages.ts players 796 850 920
 *   npx tsx scripts/retry-skipped-pages.ts clubs 10 15
 *   npx tsx scripts/retry-skipped-pages.ts tournaments 5 8
 *
 * Prerequisites:
 *   - Install tsx if not already installed: npm install -g tsx
 *   - Or use: yarn add -D tsx && yarn tsx scripts/retry-skipped-pages.ts players 796
 */

import { chromium } from 'playwright';
import { RateLimiter } from '../src/lib/gomafia/import/rate-limiter';
import { PlayersScraper } from '../src/lib/gomafia/scrapers/players-scraper';
import { ClubsScraper } from '../src/lib/gomafia/scrapers/clubs-scraper';
import { TournamentsScraper } from '../src/lib/gomafia/scrapers/tournaments-scraper';

async function retrySkippedPages(
  entityType: 'players' | 'clubs' | 'tournaments',
  pageNumbers: number[]
) {
  console.log(
    `\n🔄 Retrying ${pageNumbers.length} skipped pages for ${entityType}...`
  );
  console.log(`   Pages: ${pageNumbers.join(', ')}\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const rateLimiter = new RateLimiter(2000); // 2 seconds between requests

  try {
    switch (entityType) {
      case 'players': {
        const scraper = new PlayersScraper(page, rateLimiter);

        const retriedData = await scraper.retrySkippedPages(pageNumbers, {
          year: new Date().getFullYear(),
          region: 'all',
        });

        console.log(
          `✅ Successfully retried ${retriedData.length} players from ${pageNumbers.length} pages`
        );

        // You can add database saving logic here if needed
        // For now, data is returned but not automatically saved

        break;
      }

      case 'clubs': {
        const scraper = new ClubsScraper(page, rateLimiter);

        const retriedData = await scraper.retrySkippedPages(pageNumbers, {
          year: new Date().getFullYear(),
          region: 'all',
        });

        console.log(
          `✅ Successfully retried ${retriedData.length} clubs from ${pageNumbers.length} pages`
        );
        break;
      }

      case 'tournaments': {
        const scraper = new TournamentsScraper(page, rateLimiter);

        const retriedData = await scraper.retrySkippedPages(pageNumbers, {
          timeFilter: 'all',
        });

        console.log(
          `✅ Successfully retried ${retriedData.length} tournaments from ${pageNumbers.length} pages`
        );
        break;
      }
    }
  } catch (error) {
    console.error(`❌ Error retrying pages:`, error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(`
Usage: npx tsx scripts/retry-skipped-pages.ts <entityType> <pageNumbers>

Examples:
  npx tsx scripts/retry-skipped-pages.ts players 796
  npx tsx scripts/retry-skipped-pages.ts players 796 850 920
  npx tsx scripts/retry-skipped-pages.ts clubs 10
  npx tsx scripts/retry-skipped-pages.ts tournaments 5 8

Entity types: players, clubs, tournaments
  `);
  process.exit(1);
}

const entityType = args[0] as 'players' | 'clubs' | 'tournaments';
const pageNumbers = args.slice(1).map(Number);

if (!['players', 'clubs', 'tournaments'].includes(entityType)) {
  console.error(`Invalid entity type: ${entityType}`);
  console.error('Must be one of: players, clubs, tournaments');
  process.exit(1);
}

if (pageNumbers.some(isNaN)) {
  console.error('Invalid page numbers. All must be integers.');
  process.exit(1);
}

retrySkippedPages(entityType, pageNumbers)
  .then(() => {
    console.log('\n✨ Retry complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Retry failed:', error);
    process.exit(1);
  });
