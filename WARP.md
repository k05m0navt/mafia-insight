# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Mafia Insight is a comprehensive analytics platform for Sport Mafia game players, teams, and tournaments. The platform scrapes data from gomafia.pro and provides detailed analytics, ELO ratings, role-based performance tracking, and team/tournament management.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Prisma ORM, PostgreSQL, Supabase, NextAuth.js, TanStack Query, Zustand, Tailwind CSS, ShadCN/UI

## Commands

### Development

```bash
yarn dev              # Start development server on http://localhost:3000
yarn build            # Build for production
yarn start            # Start production server
```

### Code Quality & Type Checking

```bash
yarn lint             # Run ESLint
yarn lint:fix         # Auto-fix ESLint issues
yarn type-check       # Run TypeScript type checking (required before commits)
yarn format           # Format code with Prettier
```

### Testing

```bash
yarn test             # Run unit tests (Vitest)
yarn test:watch       # Run tests in watch mode
yarn test:coverage    # Run tests with coverage report
yarn test:ui          # Open Vitest UI
yarn test:e2e         # Run E2E tests (Playwright)
```

### Database

```bash
yarn db:generate      # Generate Prisma client (run after schema changes)
yarn db:migrate       # Create and apply database migrations
yarn db:deploy        # Deploy migrations to production
yarn db:seed          # Seed database with sample data
yarn db:reset         # Reset database (WARNING: deletes all data)
yarn db:studio        # Open Prisma Studio for database GUI
```

### Running Single Tests

```bash
# Unit tests
yarn test tests/unit/specific-test.test.ts

# E2E tests
yarn test:e2e tests/e2e/specific-spec.spec.ts
```

## Architecture

### Data Synchronization System (Critical Component)

The app's core functionality revolves around synchronizing data from gomafia.pro using **Playwright browser automation**. This is not a simple REST API integration.

**Key components:**

- **Parser** (`src/lib/parsers/gomafiaParser.ts`): Scrapes HTML using Playwright, handles retries and rate limiting
- **Sync Job** (`src/lib/jobs/syncJob.ts`): Orchestrates full/incremental syncs, batch processing, error recovery
- **Sync API** (`src/app/api/gomafia-sync/`): Endpoints for triggering syncs, checking status, viewing logs
- **Database Models**: `SyncLog`, `SyncStatus` track all sync operations; all main entities have `lastSyncAt`, `syncStatus` fields

**Important sync patterns:**

- All syncs run asynchronously in background
- Full sync: Fetches all data from scratch (resource-intensive)
- Incremental sync: Updates only stale/failed records
- Rate limiting: 10 requests/min to gomafia.pro (configurable via `RATE_LIMIT_MS`)
- Retry logic: Exponential backoff with max 5 retries (default)
- Batch size: 100 records per batch (configurable via `SYNC_BATCH_SIZE`)

### Service Layer Architecture

All business logic is encapsulated in service classes (not direct database calls in API routes):

- `PlayerService` (`src/services/playerService.ts`): Player CRUD, analytics
- `ClubService` (`src/services/clubService.ts`): Club management
- `TournamentService` (`src/services/tournamentService.ts`): Tournament operations
- `GameService` (`src/services/gameService.ts`): Game records
- `AnalyticsService` (`src/services/analyticsService.ts`): Pre-computed metrics

**Pattern:** API routes → Service methods → Prisma queries

### Database Schema Key Concepts

**Core entities:** `User`, `Player`, `Club`, `Game`, `Tournament`, `GameParticipation`, `PlayerRoleStats`, `Analytics`

**Important relationships:**

- `Player` has `userId` (ownership), optional `clubId`, multiple `GameParticipation`
- Each `Player` has one `PlayerRoleStats` per role (DON, MAFIA, SHERIFF, CITIZEN)
- `Game` has 10 `GameParticipation` records (standard Mafia game)
- All synced entities have `gomafiaId` (unique external ID), `lastSyncAt`, `syncStatus`

**Enums:**

- `PlayerRole`: DON, MAFIA, SHERIFF, CITIZEN
- `Team`: BLACK (mafia), RED (citizens)
- `EntitySyncStatus`: SYNCED, PENDING, ERROR
- See `prisma/schema.prisma` for complete list

### State Management

- **Server state:** TanStack Query for caching API responses
- **Client state:** Zustand stores in `src/store/`
- **Auth state:** NextAuth.js session management

### Route Structure

```
src/app/
├── (auth)/          # Auth pages (login, register)
├── (dashboard)/     # Main app routes (players, clubs, tournaments)
│   ├── players/[id]
│   ├── clubs/[id]
│   └── tournaments/[id]
└── api/             # API routes
    ├── auth/[...nextauth]
    ├── players/
    ├── clubs/
    ├── tournaments/
    ├── games/
    └── gomafia-sync/  # Sync-related endpoints
```

### Path Aliases

Use `@/*` for imports: `import { db } from '@/lib/db'`

## Development Workflow

### Before Making Database Changes

1. Modify `prisma/schema.prisma`
2. Run `yarn db:generate` to update Prisma client
3. Run `yarn db:migrate` to create migration
4. Test changes locally before committing

### Before Committing

1. Run `yarn type-check` (required - catches TypeScript errors)
2. Run `yarn lint:fix` (auto-formats code)
3. Husky pre-commit hooks will run lint-staged checks

### Working with Sync System

- Never assume gomafia.pro has a REST API - it's browser automation
- Check `docs/gomafia-sync.md` for detailed sync documentation
- Always handle `EntitySyncStatus` when creating/updating synced entities
- Test rate limiting with `RATE_LIMIT_MS` env var

### Testing Philosophy

- Unit tests in `tests/unit/` for utilities and business logic
- Integration tests in `tests/integration/` for service layer
- E2E tests in `tests/e2e/` for critical user flows
- Test setup in `tests/setup.ts`

## Environment Variables

Required for development (see `.env.example`):

**Database:**

- `DATABASE_URL`: PostgreSQL connection (Supabase or local)
- `DIRECT_URL`: Direct database connection (Supabase pooling)

**Supabase:**

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Auth:**

- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.

**Sync:**

- `GOMAFIA_BASE_URL` (default: https://gomafia.pro)
- `SYNC_BATCH_SIZE` (default: 100)
- `SYNC_MAX_RETRIES` (default: 5)
- `SYNC_CRON_SCHEDULE` (cron expression)

**Optional:**

- `REDIS_URL`: For caching (Redis)
- `SENTRY_DSN`: Error tracking

## Common Patterns

### API Route Pattern

```typescript
// src/app/api/entity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { EntityService } from '@/services/entityService';

export async function GET(request: NextRequest) {
  try {
    const service = new EntityService();
    const data = await service.getData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Service Method Pattern

```typescript
// src/services/entityService.ts
import { prisma } from '@/lib/db';
import { EntitySchema } from '@/lib/validations';

export class EntityService {
  async getData() {
    return await prisma.entity.findMany({
      include: { relation: true },
    });
  }
}
```

### Validation Pattern

```typescript
// Always use Zod schemas from @/lib/validations
import { EntitySchema } from '@/lib/validations';
const validated = EntitySchema.parse(data);
```

## Important Notes

- **TypeScript:** Strict mode enabled - all code must be type-safe
- **ESLint config:** Underscore-prefixed variables (e.g., `_unused`) are ignored by no-unused-vars rule
- **Prisma client:** Exported as both `prisma` and `db` from `@/lib/db` (use `db` for consistency)
- **Playwright:** Used for scraping, not testing (E2E tests use Playwright test runner separately)
- **Subscription tiers:** FREE, PREMIUM, CLUB, ENTERPRISE - check user tier for feature gating
- **NextAuth session:** User ID and subscription tier are included in session callbacks

## Troubleshooting

**Database connection issues:**

- Check `DATABASE_URL` and `DIRECT_URL` are correct
- Run `yarn db:generate` after schema changes
- Supabase requires both pooled and direct connection strings

**Sync issues:**

- Check `docs/gomafia-sync.md` for detailed troubleshooting
- View sync logs at `/api/gomafia-sync/sync/logs`
- Check `SyncStatus` table for current operation status

**Type errors:**

- Run `yarn db:generate` after Prisma schema changes
- Check Prisma client is up to date
- Clear `.next` cache: `rm -rf .next`

**Test failures:**

- Check test environment variables in `vitest.config.ts`
- Ensure test database is set up: `DATABASE_URL=postgresql://test:test@localhost:5432/mafia_insight_test`
