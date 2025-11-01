# Quickstart: Admin Dashboard & Import Controls

**Feature**: 011-admin-dashboard  
**Estimated Time**: 5-7 days  
**Prerequisites**: Existing Next.js 16 app with admin infrastructure, import orchestrator, Prisma, and TanStack Query

## Overview

This quickstart guide provides a rapid implementation path for the admin dashboard with import controls, database clear operations, and enhanced dark theme. Follow these steps in order for the most efficient implementation.

---

## Day 1: Admin Dashboard Metrics (P1)

### Step 1: Create Dashboard Service

**Goal**: Implement business logic for dashboard metrics calculation

```bash
# 1. Create dashboard service
#    File: src/lib/admin/dashboard-service.ts

# Structure:
import { db } from '@/lib/db';

export async function getDashboardMetrics() {
  const [players, games, tournaments, clubs, syncStatus] = await Promise.all([
    db.player.count(),
    db.game.count(),
    db.tournament.count(),
    db.club.count(),
    db.syncStatus.findUnique({ where: { id: 'current' } }),
  ]);

  return {
    dataVolumes: { players, games, tournaments, clubs },
    importStatus: syncStatus,
    systemHealth: await getSystemHealth(),
    recentActivity: await getRecentActivity(),
  };
}
```

**Test**:

```bash
# Unit test
yarn test tests/unit/lib/admin/dashboard-service.test.ts
```

---

### Step 2: Create Dashboard API Route

**Goal**: Expose dashboard metrics via REST API

```bash
# 1. Create API route
#    File: src/app/api/admin/dashboard/route.ts

# Structure:
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import { getDashboardMetrics } from '@/lib/admin/dashboard-service';

export async function GET(request: NextRequest) {
  try {
    await withAdminAuth()(request);
    const metrics = await getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
```

**Test**:

```bash
# Integration test
yarn test tests/integration/api/admin/dashboard.test.ts
```

---

### Step 3: Create Dashboard Components

**Goal**: Build UI components for dashboard display

```bash
# 1. Create DashboardMetrics component
#    File: src/components/admin/DashboardMetrics.tsx

# Structure:
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

export function DashboardMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => fetch('/api/admin/dashboard').then(r => r.json()),
    refetchInterval: 5000,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard title="Players" value={data?.dataVolumes?.players} />
      <MetricCard title="Games" value={data?.dataVolumes?.games} />
      {/* ... */}
    </div>
  );
}
```

**Test**:

```bash
# Component test
yarn test tests/unit/components/admin/DashboardMetrics.test.tsx
```

---

## Day 2: Import Cancellation (P1)

### Step 1: Enhance Import Orchestrator

**Goal**: Add cancellation support to existing orchestrator

```bash
# 1. Update ImportOrchestrator
#    File: src/lib/gomafia/import/import-orchestrator.ts

# Already has setCancellationSignal() method, verify:
- Checks AbortSignal.aborted at safe points
- Saves checkpoint before termination
- Releases advisory locks
```

**Test**:

```bash
# Unit test cancellation
yarn test tests/unit/lib/gomafia/import/orchestrator.test.ts
```

---

### Step 2: Create Import Control Service

**Goal**: Business logic for stopping imports

```bash
# 1. Create import control service
#    File: src/lib/admin/import-control-service.ts

# Structure:
import { db } from '@/lib/db';
import { setCancellationSignal } from '@/lib/gomafia/import/import-orchestrator';

export async function cancelImport(adminId: string) {
  // Check if running
  const status = await db.syncStatus.findUnique({ where: { id: 'current' } });
  if (!status?.isRunning) {
    throw new Error('No import currently running');
  }

  // Signal cancellation
  setCancellationSignal();

  // Wait for graceful shutdown
  await waitForShutdown();

  // Update status
  await db.syncStatus.update({
    where: { id: 'current' },
    data: { status: 'CANCELLED', cancelledBy: adminId },
  });
}
```

---

### Step 3: Create Stop Import API

**Goal**: REST API for import cancellation

```bash
# 1. Create API route
#    File: src/app/api/admin/import/stop/route.ts

export async function POST(request: NextRequest) {
  try {
    await withAdminAuth()(request);
    const adminId = request.user.id;
    const result = await cancelImport(adminId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

---

## Day 3: Database Clear (P1)

### Step 1: Create Database Clear Service

**Goal**: Transaction-based database clearing

```bash
# 1. Create database clear service
#    File: src/lib/admin/database-clear-service.ts

# Structure:
export async function clearDatabase(adminId: string) {
  // Verify no active import
  const status = await db.syncStatus.findUnique({ where: { id: 'current' } });
  if (status?.isRunning) {
    throw new Error('Cannot clear during active import');
  }

  // Delete in transaction
  const deleted = await db.$transaction(async (tx) => {
    await tx.gameParticipation.deleteMany({});
    await tx.playerYearStats.deleteMany({});
    await tx.playerRoleStats.deleteMany({});
    await tx.playerTournament.deleteMany({});
    await tx.game.deleteMany({});
    await tx.tournament.deleteMany({});
    await tx.player.deleteMany({});
    await tx.club.deleteMany({});
    await tx.analytics.deleteMany({});

    // Return counts before delete
    return { /* ... */ };
  });

  // Log operation
  await logDatabaseClear(adminId);

  return deleted;
}
```

**Test**:

```bash
# Integration test with transaction rollback
yarn test tests/integration/lib/admin/database-clear-service.test.ts
```

---

### Step 2: Create Clear DB API

**Goal**: REST API for database clearing

```bash
# 1. Create API route
#    File: src/app/api/admin/import/clear-db/route.ts

export async function POST(request: NextRequest) {
  try {
    await withAdminAuth()(request);
    const { confirm } = await request.json();

    if (!confirm) {
      return NextResponse.json({ error: 'Must confirm database clear' }, { status: 400 });
    }

    const adminId = request.user.id;
    const result = await clearDatabase(adminId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

---

## Day 4: UI Components and Integration (P1)

### Step 1: Create Import Controls UI

**Goal**: Buttons and dialogs for admin operations

```bash
# 1. Create ImportControls component
#    File: src/components/admin/ImportControls.tsx

# Structure:
import { Button } from '@/components/ui/button';
import { AlertDialog } from '@/components/ui/alert-dialog';

export function ImportControls() {
  const handleStopImport = async () => {
    if (!confirm('Stop import? Current batch will complete first.')) return;
    await fetch('/api/admin/import/stop', { method: 'POST' });
  };

  const handleClearDB = async () => {
    if (!confirm('Delete ALL game data? This cannot be undone!')) return;
    await fetch('/api/admin/import/clear-db', {
      method: 'POST',
      body: JSON.stringify({ confirm: true })
    });
  };

  return (
    <div>
      <Button onClick={handleStopImport}>Stop Import</Button>
      <Button variant="destructive" onClick={handleClearDB}>Clear Database</Button>
    </div>
  );
}
```

---

### Step 2: Enhance Admin Dashboard Page

**Goal**: Integrate all components into dashboard

```bash
# 1. Update admin dashboard page
#    File: src/app/(admin)/page.tsx

# Add:
- DashboardMetrics component
- ImportControls component
- SystemHealthBadge component
- RecentActivity component
- QuickActions component
```

---

## Day 5-6: Dark Theme Enhancement (P2)

### Step 1: Audit Current Theme

**Goal**: Identify contrast issues

```bash
# 1. Use accessibility tools
#    Run: yarn test tests/a11y/dark-theme-contrast.test.ts

# 2. Manual testing
- Enable dark mode
- Navigate all pages
- Check contrast ratios
- Note issues
```

---

### Step 2: Update CSS Custom Properties

**Goal**: Fix contrast ratios in dark theme

```bash
# 1. Update globals.css
#    File: src/app/globals.css

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;        /* 12.5:1 contrast ✓ */
  --primary: 217.2 91.2% 59.8%;     /* Bright blue */
  --primary-foreground: 222.2 84% 4.9%; /* 4.8:1 contrast ✓ */
  --muted-foreground: 215 20.2% 65.1%; /* 4.6:1 contrast ✓ */
  /* ... fix all colors */
}
```

---

### Step 3: Test All Components

**Goal**: Verify dark theme across entire app

```bash
# 1. E2E tests
yarn test:e2e tests/e2e/admin/dark-theme.spec.ts

# 2. Manual testing
- All pages
- All components
- Theme switching
- Role-based colors
```

---

## Day 7: E2E Testing and Polish

### Step 1: E2E Tests

**Goal**: Complete end-to-end workflows

```bash
# 1. Dashboard workflow
yarn test:e2e tests/e2e/admin/dashboard.spec.ts

# 2. Import cancellation workflow
yarn test:e2e tests/e2e/admin/import-cancellation.spec.ts

# 3. Database clear workflow
yarn test:e2e tests/e2e/admin/database-clear.spec.ts

# 4. Theme switching
yarn test:e2e tests/e2e/admin/dark-theme.spec.ts
```

---

### Step 2: Documentation and Cleanup

**Goal**: Finalize implementation

```bash
# 1. Update README if needed
# 2. Add component documentation
# 3. Verify all tests pass
yarn test

# 4. Run linter
yarn lint:fix
```

---

## Testing Checklist

- [ ] Unit tests for all services
- [ ] Integration tests for all API routes
- [ ] Component tests for UI elements
- [ ] E2E tests for complete workflows
- [ ] Accessibility tests for dark theme
- [ ] Manual testing in all browsers
- [ ] Performance testing (response times)
- [ ] Security testing (authorization checks)

---

## Common Issues

### Import Cancellation Not Working

- Verify AbortSignal is properly propagated
- Check advisory locks are released
- Ensure checkpoint is saved before termination

### Database Clear Failing

- Verify no active imports
- Check foreign key constraints order
- Ensure transaction rollback on error
- Verify preserved tables list

### Dark Theme Contrast Issues

- Use WebAIM Contrast Checker
- Update CSS custom properties
- Test with axe-core
- Verify WCAG AA compliance

---

## Next Steps

After completing this feature:

1. Run full test suite
2. Code review for architecture compliance
3. Deploy to staging environment
4. Manual testing in production-like environment
5. Deploy to production with monitoring
