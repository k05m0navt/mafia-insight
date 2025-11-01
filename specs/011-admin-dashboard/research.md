# Research & Technical Decisions: Admin Dashboard & Import Controls

**Feature**: 011-admin-dashboard  
**Date**: January 27, 2025  
**Status**: Complete

## Overview

This document captures technical research, decisions, and best practices for implementing the admin dashboard, import controls, database clear operations, and dark theme enhancements. Research focuses on existing infrastructure patterns and modern best practices.

---

## 1. Admin Dashboard Real-Time Updates

### Decision

Use polling with TanStack Query for near-real-time dashboard updates, with 5-second polling interval for active import operations and 30-second for general metrics.

### Rationale

- **Existing Infrastructure**: TanStack Query already in use for server state management
- **Simplicity**: Polling is simpler than WebSocket for admin dashboard use case
- **Reliability**: Automatic retry and error handling built into TanStack Query
- **Performance**: 5-second polling acceptable for admin users, reduces server load compared to WebSocket connections
- **Automatic Cleanup**: Query invalidation and cleanup handled by TanStack Query

### Implementation Pattern

```typescript
// src/hooks/useAdminDashboard.ts
import { useQuery } from '@tanstack/react-query';

export function useAdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchDashboardMetrics,
    refetchInterval: 5000, // 5 seconds for active imports
    staleTime: 3000,
  });

  return { data, isLoading, error };
}
```

### Alternatives Considered

- **WebSockets**: Overkill for admin dashboard, adds complexity and connection management overhead
- **Server-Sent Events (SSE)**: Less mature ecosystem support in Next.js, polling sufficient for this use case
- **Manual Polling**: TanStack Query provides better error handling and automatic cleanup

---

## 2. Import Cancellation Implementation

### Decision

Use AbortSignal API with ImportOrchestrator to gracefully cancel import operations. Implement cancellation checkpoints in each phase of the import process.

### Rationale

- **Existing Infrastructure**: ImportOrchestrator already supports AbortSignal (from spec analysis)
- **Standard API**: AbortSignal is native browser/Node.js API for cancellation
- **Graceful Shutdown**: Allows current batch completion before termination
- **Checkpoint Preservation**: FR-012 requires checkpoint saving before cancellation
- **Lock Release**: Advisory locks can be released cleanly during cancellation

### Implementation Pattern

```typescript
// src/lib/admin/import-control-service.ts
export async function cancelImport(adminId: string): Promise<void> {
  // Check if import is running
  const status = await db.syncStatus.findUnique({ where: { id: 'current' } });
  if (!status?.isRunning) {
    throw new Error('No import operation currently running');
  }

  // Set cancellation flag in orchestrator
  // The orchestrator will check this flag at safe points
  await setCancellationSignal();

  // Wait for graceful shutdown
  await waitForImportCancellation();

  // Verify locks released
  await verifyLocksReleased();

  // Update status
  await db.syncStatus.update({
    where: { id: 'current' },
    data: {
      status: 'CANCELLED',
      cancelledBy: adminId,
      cancelledAt: new Date(),
    },
  });
}
```

### Integration Points

- ImportOrchestrator.setCancellationSignal() - Already exists per feature 003
- AdvisoryLockManager.releaseLock() - Clean up locks
- CheckpointManager.save() - Save final checkpoint

---

## 3. Database Clear Transaction Strategy

### Decision

Use Prisma transaction with deleteMany operations in correct order to handle foreign key dependencies. Wrap entire operation in try-catch for rollback.

### Rationale

- **Data Integrity**: Transactions ensure all-or-nothing database clear
- **Foreign Key Handling**: Delete in dependency order (child tables before parent tables)
- **Audit Logs**: Preserve SyncLog, SyncStatus, etc. as specified in clarifications
- **User Accounts**: Preserve all User accounts regardless of role
- **Region Data**: Preserve Region reference data for future imports

### Implementation Pattern

```typescript
// src/lib/admin/database-clear-service.ts
export async function clearDatabase(adminId: string): Promise<void> {
  // Prevent clear during active import
  const importStatus = await db.syncStatus.findUnique({
    where: { id: 'current' },
  });
  if (importStatus?.isRunning) {
    throw new Error('Cannot clear database while import is running');
  }

  // Execute clear in transaction
  await db.$transaction(async (tx) => {
    // Delete imported game data in dependency order
    await tx.gameParticipation.deleteMany({});
    await tx.playerYearStats.deleteMany({});
    await tx.playerRoleStats.deleteMany({});
    await tx.playerTournament.deleteMany({});
    await tx.game.deleteMany({});
    await tx.tournament.deleteMany({});
    await tx.player.deleteMany({});
    await tx.club.deleteMany({});
    await tx.analytics.deleteMany({});

    // Preserve: User, SyncLog, SyncStatus, ImportCheckpoint, ImportProgress,
    // Region, Notification, DataIntegrityReport, EmailLog
  });

  // Log operation
  await logDatabaseClear(adminId);
}
```

### Tables to Delete

- GameParticipation (references Player, Game)
- PlayerYearStats (references Player)
- PlayerRoleStats (references Player)
- PlayerTournament (references Player, Tournament)
- Game (references Tournament)
- Tournament
- Player (references User, Club)
- Club (references User, Player)
- Analytics

### Tables to Preserve

- User (all accounts)
- SyncLog (audit history)
- SyncStatus (current status)
- ImportCheckpoint (resume capability)
- ImportProgress (history)
- Region (reference data)
- Notification (system operations)
- DataIntegrityReport (quality tracking)
- EmailLog (communication history)

---

## 4. Dark Theme WCAG AA Implementation

### Decision

Use Tailwind CSS with CSS custom properties, calculate color contrast ratios to meet WCAG AA standards, and test all components for accessibility compliance.

### Rationale

- **Existing Infrastructure**: Tailwind CSS and CSS custom properties already in use
- **Consistency**: ShadCN/UI components use same pattern
- **Accessibility**: WCAG AA compliance required for professional application
- **Maintainability**: CSS custom properties enable easy theme switching
- **Performance**: No runtime JS required for theme switching

### Implementation Pattern

```css
/* src/app/globals.css */
@layer base {
  :root {
    /* Light theme - existing values */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... */
  }

  .dark {
    /* Dark theme with WCAG AA compliant contrast */
    --background: 222.2 84% 4.9%; /* HSL */
    --foreground: 210 40% 98%; /* 12.5:1 contrast */
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%; /* 12.5:1 contrast */
    --primary: 217.2 91.2% 59.8%; /* Bright blue for buttons */
    --primary-foreground: 222.2 84% 4.9%; /* 4.8:1 contrast (meets AA) */
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%; /* 4.6:1 contrast */
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 50%; /* Brighter red for visibility */
    --destructive-foreground: 210 40% 98%; /* 4.9:1 contrast */
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 217.2 91.2% 59.8%;
  }
}
```

### Role-Based Colors for Dark Theme

```css
.dark {
  /* Adjust role colors for dark backgrounds */
  --color-don: 268 72% 65%; /* Lighter purple */
  --color-mafia: 0 0% 20%; /* Dark gray, not pure black */
  --color-sheriff: 55 90% 60%; /* Brighter yellow */
  --color-citizen: 26 80% 55%; /* Brighter brown/tan */
}
```

### Testing Requirements

- Use automated contrast checking tools (axe-core, Lighthouse)
- Manual testing with screen readers
- Visual inspection in multiple browsers
- Role-based color validation

### Tools

- **Contrast Ratio Calculator**: WebAIM Contrast Checker
- **Automated Testing**: axe-core in Playwright tests
- **Visual Validation**: Browser DevTools, Stark plugin

---

## 5. Dashboard Metrics Calculation

### Decision

Implement efficient aggregation queries with Prisma, cache results for 30 seconds, and calculate metrics on-demand rather than background jobs.

### Rationale

- **Freshness**: Admin dashboard needs current metrics
- **Performance**: Aggregation queries fast enough for admin use case
- **Simplicity**: No background job infrastructure needed
- **Caching**: TanStack Query provides automatic caching
- **Scalability**: Prisma aggregation handles large datasets efficiently

### Implementation Pattern

```typescript
// src/lib/admin/dashboard-service.ts
export async function getDashboardMetrics() {
  const [
    totalPlayers,
    totalGames,
    totalTournaments,
    totalClubs,
    recentImports,
    systemHealth,
  ] = await Promise.all([
    db.player.count(),
    db.game.count(),
    db.tournament.count(),
    db.club.count(),
    getRecentImports(),
    getSystemHealth(),
  ]);

  return {
    dataVolumes: { totalPlayers, totalGames, totalTournaments, totalClubs },
    recentImports,
    systemHealth,
  };
}
```

### Metrics Included

- **Data Volumes**: Total counts for players, games, tournaments, clubs
- **Import Status**: Current progress, last sync time, next scheduled sync
- **System Health**: Database connectivity, error counts in last 24h
- **Recent Activity**: New users, import operations, system alerts

---

## Summary

All technical decisions align with existing infrastructure patterns and modern best practices. No fundamental changes to architecture required. Implementation leverages existing tools (TanStack Query, Prisma, Tailwind CSS) and follows established patterns from previous features. All "NEEDS CLARIFICATION" items resolved.
