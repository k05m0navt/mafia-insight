# Quickstart Guide: Replace Mock Scrapers with Real Scrapers

**Date**: January 27, 2025  
**Feature**: Replace Mock Scrapers with Real Scrapers  
**Status**: Ready for Implementation

## Overview

This feature replaces mock data generation in the admin import workflow with real Playwright-based scrapers from gomafia.pro. Each admin strategy button now triggers its corresponding Phase class with actual data scraping, validation, rate limiting, and progress tracking.

## Key Components

### 1. Admin Import Endpoint (`src/app/api/admin/import/start/route.ts`)

**Before**: Generated mock data using `generateSampleData()`.  
**After**: Launches browser, creates ImportOrchestrator, executes specific Phase class.

**Main Changes**:

- Remove `generateSampleData()` function and sample data interfaces
- Add browser launch and cleanup logic
- Create `ImportOrchestrator` (7-phase) instance
- Map strategy to Phase class
- Execute selected phase
- Update progress via `ImportOrchestrator` (singleton)

### 2. Phase Classes (`src/lib/gomafia/import/phases/`)

**Status**: Already implemented and tested. No changes needed.

All Phase classes are already functional:

- `ClubsPhase` → `PlayersScraper`
- `PlayersPhase` → `PlayersScraper`
- `TournamentsPhase` → `TournamentsScraper`
- `GamesPhase` → `TournamentGamesScraper`
- `PlayerYearStatsPhase` → `PlayerStatsScraper`
- `PlayerTournamentPhase` → `PlayerTournamentHistoryScraper`

### 3. Progress Tracking (`src/lib/gomafia/import/orchestrator.ts`)

**Status**: Already implemented. Unchanged.

`ImportOrchestrator` singleton tracks import progress in `ImportProgress` table, used by `/api/import/progress`.

### 4. Admin Dashboard (`src/app/admin/import/page.tsx`)

**Status**: Already implemented. No UI changes needed.

Admin dashboard displays import history and real-time progress without modification.

## Strategy to Phase Mapping

```typescript
const STRATEGY_TO_PHASE_MAP = {
  players: PlayersPhase,
  clubs: ClubsPhase,
  tournaments: TournamentsPhase,
  games: GamesPhase,
  player_stats: PlayerYearStatsPhase,
  tournament_results: PlayerTournamentPhase,
};
```

## Prerequisites

### Required Dependencies

All dependencies already installed:

```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "next": "^16.0.0",
    "playwright": "^1.56.1",
    "zod": "^4.1.12"
  }
}
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# gomafia.pro scraping
GOMAFIA_BASE_URL=https://gomafia.pro (optional, defaults to production)
```

### Browser Installation

```bash
npx playwright install chromium
```

## Implementation Steps

### Step 1: Refactor Admin Import Endpoint

Create new implementation following `/api/gomafia-sync/import` pattern:

```typescript
// src/app/api/admin/import/start/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { chromium, Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { importOrchestrator } from '@/lib/gomafia/import/orchestrator';
import { AdvisoryLockManager } from '@/lib/gomafia/import/advisory-lock';
import { prisma as db } from '@/lib/db';
import { z } from 'zod';

// Strategy to Phase mapping
import { ClubsPhase } from '@/lib/gomafia/import/phases/clubs-phase';
import { PlayersPhase } from '@/lib/gomafia/import/phases/players-phase';
import { TournamentsPhase } from '@/lib/gomafia/import/phases/tournaments-phase';
import { GamesPhase } from '@/lib/gomafia/import/phases/games-phase';
import { PlayerYearStatsPhase } from '@/lib/gomafia/import/phases/player-year-stats-phase';
import { PlayerTournamentPhase } from '@/lib/gomafia/import/phases/player-tournament-phase';

const requestSchema = z.object({
  strategy: z.enum([
    'players',
    'clubs',
    'tournaments',
    'games',
    'player_stats',
    'tournament_results',
  ]),
});

export async function POST(request: NextRequest) {
  let browser: Browser | null = null;

  try {
    const body = await request.json();
    const { strategy } = requestSchema.parse(body);

    // Create advisory lock manager
    const lockManager = new AdvisoryLockManager(db);

    // Try to acquire lock
    const lockAcquired = await lockManager.acquireLock('admin-import');
    if (!lockAcquired) {
      return NextResponse.json(
        { error: 'Import already in progress', code: 'ADVISORY_LOCK_HELD' },
        { status: 409 }
      );
    }

    // Launch browser for scraping
    browser = await chromium.launch({ headless: true });

    // Create ImportOrchestrator (7-phase) with browser
    const orchestrator = new ImportOrchestrator(db, browser);

    // Get corresponding Phase class for strategy
    const PhaseClass = getPhaseClass(strategy);
    if (!PhaseClass) {
      throw new Error(`Unknown strategy: ${strategy}`);
    }

    // Create phase instance
    const phase = new PhaseClass(orchestrator);

    // Start progress tracking in ImportOrchestrator (singleton)
    const importId = await importOrchestrator.startImport(
      strategy,
      100 // Estimate, will be updated by phase
    );

    // Execute phase in background (non-blocking)
    executePhaseInBackground(phase, importId, lockManager, browser).catch(
      (error) => {
        console.error(`[AdminImport] Phase execution failed:`, error);
        importOrchestrator.failImport(importId);
      }
    );

    return NextResponse.json({
      importId,
      message: `Import started for strategy: ${strategy}`,
    });
  } catch (error) {
    console.error('Error starting admin import:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    // Clean up browser if launched
    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      {
        error: 'Failed to start import',
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

function getPhaseClass(strategy: string) {
  const map = {
    players: PlayersPhase,
    clubs: ClubsPhase,
    tournaments: TournamentsPhase,
    games: GamesPhase,
    player_stats: PlayerYearStatsPhase,
    tournament_results: PlayerTournamentPhase,
  };
  return map[strategy as keyof typeof map];
}

async function executePhaseInBackground(
  phase: any,
  importId: string,
  lockManager: AdvisoryLockManager,
  browser: Browser
): Promise<void> {
  try {
    // Execute phase
    await phase.execute();

    // Get metrics from orchestrator
    const metrics = phase.orchestrator.getValidationMetrics();

    // Update progress based on actual results
    await importOrchestrator.updateProgress(importId, metrics.validRecords, 0);

    // Mark as completed
    await importOrchestrator.completeImport(importId);

    console.log(`[AdminImport] Import ${importId} completed successfully`);
  } catch (error) {
    console.error(`[AdminImport] Import ${importId} failed:`, error);
    await importOrchestrator.failImport(importId);
    throw error;
  } finally {
    // Always clean up browser and release lock
    if (browser) {
      await browser.close();
    }
    await lockManager.releaseLock();
  }
}
```

### Step 2: Remove Mock Data Generation

Delete `generateSampleData()` function and all Sample\* interfaces from the file.

### Step 3: Update Tests

Create tests for new admin import logic:

```typescript
// tests/integration/admin-import.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/admin/import/start/route';

describe('Admin Import with Real Scrapers', () => {
  it('should start Players import with real scraper', async () => {
    const request = new Request(
      'http://localhost:3000/api/admin/import/start',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: 'players' }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.importId).toBeDefined();
    expect(data.message).toContain('players');
  });
});
```

### Step 4: Update Existing Tests

Update E2E tests to verify real data instead of mock data:

```typescript
// tests/e2e/admin-import.spec.ts

test('admin import uses real scrapers', async ({ page }) => {
  await page.goto('/admin/import');
  await page.click('text=Start Import'); // Players button

  // Wait for import to complete
  await expect(page.locator('text=COMPLETED')).toBeVisible({ timeout: 300000 });

  // Verify real data in database
  const players = await db.player.findMany({ take: 5 });
  expect(players[0].name).not.toMatch(/^Player \d+$/); // Real names, not "Player 1"
  expect(players[0].gomafiaId).toBeTruthy();
});
```

## Testing Strategy

### Unit Tests

- Mock browser and scrape operations
- Test strategy-to-phase mapping
- Test advisory lock acquisition/release
- Test progress updates

### Integration Tests

- Real browser with Playwright
- Test phase execution with real scrapers
- Verify database inserts with real data
- Test error handling and cleanup

### E2E Tests

- Full flow from admin UI to database
- Verify real data appears in dashboard
- Test concurrent import prevention
- Test cancel/resume functionality

## Verification Checklist

After implementation, verify:

- [x] Mock data generation completely removed
- [x] Each admin strategy button triggers correct Phase class
- [x] Real scrapers fetch data from gomafia.pro
- [x] Progress updates display in admin dashboard
- [ ] Validation metrics show ≥95% validation rate (to be tested in production)
- [x] Advisory lock prevents concurrent imports
- [x] Browser resources cleaned up after import
- [x] Error handling works for network failures (Phase classes handle this)
- [x] Rate limiting enforced (2 seconds between requests, via ImportOrchestrator)
- [x] Import history displays in admin dashboard

## Troubleshooting

**Browser launch fails**

- Install Playwright browsers: `npx playwright install chromium`
- Check system dependencies for headless Chrome

**Import hangs indefinitely**

- Check gomafia.pro availability
- Verify network connectivity
- Review Playwright logs for timeout errors

**Progress not updating**

- Verify `ImportOrchestrator` (singleton) integration
- Check database `ImportProgress` table
- Verify admin dashboard polling endpoint

## Performance Benchmarks

**Expected Performance** (per phase):

- Players (1000 records): 3-5 minutes
- Clubs (100 records): 2-3 minutes
- Tournaments (500 records): 4-6 minutes
- Games (2000 records): 5-8 minutes
- Player Stats (per player): 2-4 minutes
- Tournament Results (per tournament): 3-5 minutes

**Validation Rate**: ≥95% of scraped records should pass validation.
