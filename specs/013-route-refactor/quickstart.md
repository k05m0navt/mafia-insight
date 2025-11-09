# Quick Start: Route and Database Refactoring

**Feature**: 013-route-refactor  
**Date**: 2025-01-27

## Overview

This guide provides a quick reference for implementing the route and database refactoring feature. The feature analyzes routes, pages, and database tables to identify unused components, optimize performance, and improve code quality.

## Prerequisites

- Access to Supabase database and advisors
- Environment variables configured (NODE_ENV)
- E2E test suite available
- Code analysis tools installed (jscpd, eslint)
- Accessibility testing tools (@axe-core/playwright, lighthouse)

## Quick Implementation Steps

### 1. Analyze Routes and Pages

```bash
# Run route analysis script
node scripts/analyze-routes.js

# Run page analysis script
node scripts/analyze-pages.js

# Check results
cat analysis-results/routes.json
cat analysis-results/pages.json
```

**Expected Output**:

- List of unused routes/pages
- List of incomplete routes
- List of pages needing refactoring
- Code quality metrics

### 2. Gate Test Routes in Production

**File**: `src/app/api/test-players/route.ts`

```typescript
export async function GET(request: NextRequest) {
  // Gate test routes in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // ... existing handler code
}
```

**File**: `src/app/(dashboard)/test-players/page.tsx`

```typescript
export default function TestPlayersPage() {
  // Gate test pages in production
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
    return null;
  }

  // ... existing page code
}
```

### 3. Analyze Database Tables

```bash
# Query Supabase for table row counts
# Check code references using grep/ripgrep
# Review Prisma schema for model usage

# Example SQL query
psql $DATABASE_URL -c "SELECT 'analytics' as table_name, COUNT(*) as row_count FROM analytics UNION ALL SELECT 'player_role_stats', COUNT(*) FROM player_role_stats UNION ALL SELECT 'regions', COUNT(*) FROM regions;"
```

### 4. Create Zero-Downtime Database Migrations

**File**: `prisma/migrations/YYYYMMDDHHMMSS_add_foreign_key_indexes/migration.sql`

```sql
-- Add indexes to foreign keys using CONCURRENT (zero-downtime)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clubs_created_by ON clubs("createdBy");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clubs_president_id ON clubs("presidentId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_user_id ON players("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_club_id ON players("clubId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_tournament_id ON games("tournamentId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournaments_created_by ON tournaments("createdBy");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_tournaments_tournament_id ON player_tournaments("tournamentId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_participations_game_id ON game_participations("gameId");
```

**File**: `prisma/migrations/YYYYMMDDHHMMSS_remove_unused_indexes/migration.sql`

```sql
-- Remove unused indexes (identified by Supabase advisors)
DROP INDEX IF EXISTS notifications_createdAt_idx;
DROP INDEX IF EXISTS data_integrity_reports_timestamp_idx;
DROP INDEX IF EXISTS data_integrity_reports_status_idx;
DROP INDEX IF EXISTS email_logs_status_createdAt_idx;
DROP INDEX IF EXISTS email_logs_type_idx;
```

### 5. Optimize RLS Policies

**File**: `prisma/migrations/YYYYMMDDHHMMSS_optimize_rls_policies/migration.sql`

```sql
-- Optimize RLS policies on users table
-- Replace auth.uid() with (select auth.uid()) for better performance

DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING ((select auth.uid()) = id);
```

### 6. Analyze Code Quality

```bash
# Install code duplication detector
yarn add -D jscpd

# Run duplication analysis
yarn jscpd src/app --min-lines 5 --min-tokens 50 --format json --output analysis-results/

# Check error handling coverage
node scripts/analyze-error-handling.js

# Run accessibility tests
yarn test:e2e --grep "accessibility"
```

### 7. Refactor Pages

**Example**: Refactoring a page to meet WCAG 2.1 Level AA

```typescript
// Before: Missing accessibility features
export default function PlayersPage() {
  return (
    <div>
      <img src="/logo.png" />
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}

// After: WCAG 2.1 Level AA compliant
export default function PlayersPage() {
  return (
    <main>
      <img src="/logo.png" alt="Mafia Insight Logo" />
      <button
        onClick={handleClick}
        aria-label="Filter players"
        type="button"
      >
        Click me
      </button>
    </main>
  );
}
```

### 8. Update Documentation

**File**: `docs/technical/ROUTES.md`

```markdown
# Updated Routes

## Removed Routes

- `/test-players` - Gated in production (development only)
- `/api/test-players` - Gated in production (development only)
- `/api/test-db` - Gated in production (development only)

## Refactored Routes

- `/api/users/invitations` - Removed (incomplete feature)
```

**File**: `README.md`

```markdown
# Updated Features

## Routes

- Test routes are now gated in production environments
- Removed incomplete API routes
- Optimized route structure for better performance
```

## Verification Steps

### 1. Verify Test Routes Are Gated

```bash
# In production mode
NODE_ENV=production yarn build
NODE_ENV=production yarn start

# Test that test routes return 404
curl http://localhost:3000/test-players
# Expected: 404 or redirect

# In development mode
NODE_ENV=development yarn dev

# Test that test routes work
curl http://localhost:3000/test-players
# Expected: 200 OK
```

### 2. Verify Database Migrations

```bash
# Apply migrations
yarn db:migrate

# Verify indexes were created
psql $DATABASE_URL -c "\d+ clubs" | grep idx_clubs

# Verify unused indexes were removed
psql $DATABASE_URL -c "\d+ notifications" | grep idx

# Check query performance
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM clubs c JOIN users u ON c.\"createdBy\" = u.id;"
```

### 3. Verify Code Quality Improvements

```bash
# Check duplication reduction
yarn jscpd src/app --min-lines 5 --min-tokens 50 --format json --output analysis-results/
# Compare before/after percentages

# Check error handling coverage
node scripts/analyze-error-handling.js
# Verify 90% coverage of critical paths

# Run accessibility tests
yarn test:e2e --grep "accessibility"
# Verify WCAG 2.1 Level AA compliance
```

### 4. Verify E2E Tests Pass

```bash
# Run full E2E test suite
yarn test:e2e

# Verify all tests pass
# Update test routes if needed
```

## Common Issues and Solutions

### Issue: Migration fails with lock timeout

**Solution**: Use CONCURRENT index creation for all indexes

```sql
CREATE INDEX CONCURRENTLY idx_name ON table_name(column_name);
```

### Issue: Route removal breaks E2E tests

**Solution**: Update E2E tests to use alternative data sources or mock data

```typescript
// Before: Using test route
await page.goto('/test-players');

// After: Using mock data or production route with test data
await page.route('**/api/players', (route) => {
  route.fulfill({ json: mockPlayers });
});
await page.goto('/players');
```

### Issue: Page refactoring breaks functionality

**Solution**: Write tests before refactoring, refactor incrementally

```bash
# 1. Write tests for current behavior
# 2. Refactor incrementally
# 3. Verify tests still pass
# 4. Improve code quality metrics
```

## Success Criteria Checklist

- [ ] Zero test routes accessible in production (100%)
- [ ] All unused database tables resolved (100%)
- [ ] All foreign key indexes added (100%)
- [ ] All unused indexes removed (100%)
- [ ] RLS policies optimized (100%)
- [ ] All incomplete routes resolved (100%)
- [ ] All unused pages resolved (100%)
- [ ] All pages needing refactoring improved (100%)
- [ ] Code duplication reduced by 30%
- [ ] Error handling coverage at 90%
- [ ] WCAG 2.1 Level AA compliance achieved
- [ ] E2E tests pass (100%)
- [ ] Documentation updated (100%)

## Next Steps

After completing the refactoring:

1. Monitor query performance improvements
2. Verify accessibility compliance in production
3. Review code quality metrics
4. Update team documentation
5. Plan next refactoring cycle
