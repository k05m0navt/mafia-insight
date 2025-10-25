# Quickstart Guide: Gomafia Data Integration

**Date**: December 2024  
**Feature**: Gomafia Data Integration  
**Status**: Ready for Implementation

## Overview

This feature integrates gomafia.pro data into the Mafia Insight platform by:

1. **Scraping data** from gomafia.pro using Playwright
2. **Storing data** in Supabase PostgreSQL
3. **Displaying data** in the web application with shadcn UI components

## Key Components

### 1. Data Parser (`src/lib/parsers/gomafiaParser.ts`)

- Scrapes HTML pages from gomafia.pro
- Uses Playwright for dynamic content interaction
- Parses player and game data
- Handles retry logic with exponential backoff

### 2. Sync Job (`src/lib/jobs/syncJob.ts`)

- Scheduled daily synchronization
- Supports full and incremental sync
- Batch processing for performance
- Error handling and logging

### 3. API Routes (`src/app/api/gomafia-sync/`)

- GET `/api/gomafia-sync/sync/status` - Get current sync status
- POST `/api/gomafia-sync/sync/trigger` - Manually trigger sync
- GET `/api/gomafia-sync/sync/logs` - Get sync logs

### 4. Database Models

- `SyncLog` - Tracks synchronization operations
- `SyncStatus` - Current sync state
- Extended `Player` and `Game` models with sync tracking

### 5. UI Components (`src/components/data-display/`)

- Sync status indicator
- Data tables with pagination
- Error handling displays

## Prerequisites

### Required Dependencies

```bash
# Install Playwright for browser automation
yarn add playwright
yarn add -D @playwright/test

# Install cron for scheduled jobs
yarn add cron

# Install Zod for validation
yarn add zod
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Sync Configuration
GOMAFIA_BASE_URL=https://gomafia.pro
SYNC_BATCH_SIZE=100
SYNC_MAX_RETRIES=5

# Cron Schedule (daily at midnight UTC)
SYNC_CRON_SCHEDULE="0 0 * * *"
```

## Getting Started

### Step 1: Install Playwright Browsers

```bash
npx playwright install chromium
```

### Step 2: Run Database Migration

```bash
# Generate Prisma client
yarn db:generate

# Create migration
yarn db:migrate --name add_sync_tables

# Apply migration
yarn db:migrate
```

### Step 3: Test Data Parsing

```bash
# Run parser test
yarn test src/lib/parsers/gomafiaParser.test.ts
```

### Step 4: Configure Cron Job

Add to `vercel.json` or cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/gomafia-sync/sync/trigger",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Step 5: Run Initial Sync

```bash
# Trigger manual sync
curl -X POST http://localhost:3000/api/gomafia-sync/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"type": "FULL"}'
```

## Development Workflow

### Testing Data Parser

```typescript
// Test player parsing
import { parsePlayer } from '@/lib/parsers/gomafiaParser';

const playerData = await parsePlayer('player-id-123');
console.log(playerData);
```

### Testing Sync Job

```typescript
// Test sync workflow
import { runSync } from '@/lib/jobs/syncJob';

const result = await runSync('INCREMENTAL');
console.log(result);
```

### Checking Sync Status

```typescript
// Get sync status
const response = await fetch('/api/gomafia-sync/sync/status');
const status = await response.json();
console.log(status);
```

## Common Tasks

### Manual Sync Trigger

```bash
# Trigger full sync
curl -X POST http://localhost:3000/api/gomafia-sync/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"type": "FULL"}'

# Trigger incremental sync
curl -X POST http://localhost:3000/api/gomafia-sync/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"type": "INCREMENTAL"}'
```

### View Sync Logs

```bash
# Get recent logs
curl http://localhost:3000/api/gomafia-sync/sync/logs?limit=10

# Get specific log
curl http://localhost:3000/api/gomafia-sync/sync/logs/log-id-123
```

### Check Database

```bash
# Open Prisma Studio
yarn db:studio

# Check sync logs
SELECT * FROM sync_logs ORDER BY start_time DESC LIMIT 10;
```

## Troubleshooting

### Playwright Issues

```bash
# Reinstall browsers
npx playwright install --force

# Run with headed browser for debugging
PLAYWRIGHT_HEADLESS=false yarn dev
```

### Sync Failures

```bash
# Check logs
yarn db:studio
# Navigate to sync_logs table

# View errors
SELECT id, status, errors FROM sync_logs WHERE status = 'FAILED';
```

### Performance Issues

```bash
# Adjust batch size
export SYNC_BATCH_SIZE=50

# Increase retry delay
export SYNC_RETRY_DELAY=2000
```

## Production Deployment

### Environment Setup

1. Set environment variables in Vercel dashboard
2. Configure cron job in `vercel.json`
3. Monitor sync logs in Sentry

### Monitoring

- Check sync status dashboard
- Review Sentry error logs
- Monitor database performance
- Track sync success rates

## Next Steps

1. **Implement Parser**: Create `gomafiaParser.ts` with Playwright scraping logic
2. **Implement Sync Job**: Create `syncJob.ts` with batch processing
3. **Create API Routes**: Implement sync API endpoints
4. **Add UI Components**: Build sync status and data display components
5. **Write Tests**: Add unit, integration, and E2E tests
6. **Deploy**: Configure cron job and deploy to production

## Resources

- [Plan Document](./plan.md)
- [Research Findings](./research.md)
- [Data Model](./data-model.md)
- [API Contract](./contracts/api-schema.yaml)
- [Specification](./spec.md)

## Support

For issues or questions:

1. Check sync logs in database
2. Review error messages in Sentry
3. Consult documentation in `/docs`
4. Contact development team

---

**Ready to implement!** Start with Step 1 in Getting Started and proceed through the development workflow.
