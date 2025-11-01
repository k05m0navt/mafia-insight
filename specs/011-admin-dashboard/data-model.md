# Data Model: Admin Dashboard & Import Controls

**Feature**: 011-admin-dashboard  
**Date**: January 27, 2025

## Overview

This document defines the data models for admin dashboard metrics, import control operations, and system health tracking. This feature primarily extends existing data models without requiring schema changes. All entities leverage existing database tables.

---

## Existing Entities (Used by This Feature)

### User

**Purpose**: Admin dashboard displays metrics but doesn't modify User model. User authentication is used for authorization.

**Fields**:

- `id`: UUID, primary key
- `email`: String, unique, required
- `name`: String, required
- `avatar`: String, nullable
- `subscriptionTier`: Enum (FREE, PREMIUM, CLUB, ENTERPRISE), required
- `role`: Enum (guest, user, moderator, admin), required
- `themePreference`: String, nullable (e.g., "light", "dark", "system")
- `createdAt`: DateTime
- `updatedAt`: DateTime
- `lastLogin`: DateTime, nullable

**Relationships**:

- One-to-many with Player
- One-to-many with Club
- One-to-many with Tournament
- One-to-many with Notification

**Usage**:

- Admin role check for dashboard access
- User identification in audit logs
- Theme preference persistence

---

### SyncLog

**Purpose**: Tracks all import operations including cancellations and database clears.

**Fields**:

- `id`: UUID, primary key
- `type`: Enum (FULL, INCREMENTAL), required
- `status`: Enum (RUNNING, COMPLETED, FAILED, CANCELLED), required
- `startTime`: DateTime
- `endTime`: DateTime, nullable
- `recordsProcessed`: Int, nullable
- `errors`: Json, nullable
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Relationships**:

- None

**Usage**:

- Display recent import history in dashboard
- Track cancelled imports
- Audit trail for import operations

---

### SyncStatus

**Purpose**: Current state of import operations including cancellation status.

**Fields**:

- `id`: String, primary key (always "current")
- `lastSyncTime`: DateTime, nullable
- `lastSyncType`: String, nullable
- `isRunning`: Boolean, default false
- `progress`: Int, nullable (0-100)
- `currentOperation`: String, nullable
- `lastError`: String, nullable
- `validationRate`: Float, nullable
- `totalRecordsProcessed`: Int, nullable
- `validRecords`: Int, nullable
- `invalidRecords`: Int, nullable
- `updatedAt`: DateTime

**Usage**:

- Real-time import progress display
- Import cancellation coordination
- Dashboard system health metrics
- Check if import is running before database clear

---

### ImportCheckpoint

**Purpose**: Enables import resumption from last checkpoint after cancellation.

**Fields**:

- `id`: String, primary key (always "current")
- `currentPhase`: String, required (e.g., "PLAYERS", "GAMES", "TOURNAMENTS")
- `currentBatch`: Int, required
- `lastProcessedId`: String, nullable
- `processedIds`: String[], required
- `progress`: Int, required (0-100)
- `lastUpdated`: DateTime
- `createdAt`: DateTime

**Usage**:

- Resume cancelled imports without duplicates
- Track import progress across phases
- Database clear doesn't delete this (enables fresh restart)

---

### Player, Game, Tournament, Club

**Purpose**: Game data displayed in dashboard metrics.

**Fields**: See Prisma schema

**Usage**:

- Data volume metrics (total counts)
- Last updated timestamps
- Database clear operations target these tables

---

### Notification

**Purpose**: System alerts and import status notifications.

**Fields**:

- `id`: UUID, primary key
- `userId`: String, foreign key to User
- `type`: Enum (SYNC_FAILURE, SYNC_SUCCESS, SYSTEM_ALERT, USER_ACTION), required
- `title`: String, required
- `message`: String, required
- `details`: Json, nullable
- `read`: Boolean, default false
- `createdAt`: DateTime
- `expiresAt`: DateTime, nullable

**Usage**:

- Display system alerts in dashboard
- Notify administrators of import cancellations
- System health warnings

---

## Data Flow Patterns

### Dashboard Metrics Loading

1. User navigates to `/admin`
2. Browser requests `/api/admin/dashboard`
3. Server queries database aggregations (counts, recent activity)
4. Response includes: data volumes, import status, system health, recent activity
5. TanStack Query caches response for 5 seconds
6. UI displays metrics in dashboard cards

### Import Cancellation Flow

1. Admin clicks "Stop Import" button
2. Frontend requests `/api/admin/import/stop`
3. Server checks if import is running (SyncStatus.isRunning)
4. Server signals ImportOrchestrator to cancel
5. Orchestrator completes current batch, saves checkpoint
6. Server releases advisory locks
7. Server updates SyncStatus: `status: CANCELLED`, `cancelledBy`, `cancelledAt`
8. Server creates Notification for admins
9. Response confirms cancellation
10. Frontend updates UI to show cancelled status

### Database Clear Flow

1. Admin clicks "Clear Database" button
2. Frontend shows confirmation dialog
3. Admin confirms
4. Frontend requests `/api/admin/import/clear-db`
5. Server verifies no active import (SyncStatus.isRunning === false)
6. Server starts Prisma transaction
7. Server deletes game data tables in dependency order
8. Server preserves: User, SyncLog, SyncStatus, ImportCheckpoint, etc.
9. Server logs operation to SyncLog
10. Transaction commits
11. Server creates Notification with confirmation
12. Response confirms successful clear
13. Frontend updates UI, offers option to start fresh import

### Dark Theme Application

1. User selects theme preference in UI
2. Frontend updates User.themePreference
3. ThemeProvider reads preference
4. Document root receives `dark` class
5. CSS custom properties apply dark theme colors
6. All components inherit new theme colors
7. Transition completes in <500ms
8. Theme persists in localStorage and User model

---

## Validation Rules

### Import Cancellation

- Must verify import is currently running (SyncStatus.isRunning === true)
- Must not allow cancellation if import status is COMPLETED or FAILED
- Must release all locks before marking as CANCELLED
- Must save checkpoint before termination

### Database Clear

- Must verify no active import (SyncStatus.isRunning === false)
- Must execute entire operation in Prisma transaction
- Must rollback on any error (foreign key violations, etc.)
- Must preserve exact table list from clarifications
- Must log operation with admin identity

### Dashboard Metrics

- Data volume counts must use Prisma.count() for accuracy
- Recent activity must limit to last 20 items
- System health must check database connectivity
- Error counts must aggregate from last 24 hours

---

## Indexes and Performance

### Existing Indexes (Used by This Feature)

- `SyncStatus.id`: Primary key "current" for quick status checks
- `SyncLog.status, createdAt`: For recent import filtering
- `Notification.userId, read`: For unread alert counting
- `Player.id, gomafiaId`: For data volume aggregation
- `Game.id, gomafiaId`: For data volume aggregation
- `Tournament.id, gomafiaId`: For data volume aggregation
- `Club.id, gomafiaId`: For data volume aggregation

### Query Optimization

- Dashboard metrics use Promise.all() for parallel queries
- Count queries use Prisma.count() (faster than select + length)
- Recent imports limited with Prisma.take(20)
- System health cached for 30 seconds

---

## Summary

No new database entities required for this feature. All operations use existing tables with appropriate relationships and indexes. Database clear operations require careful transaction management to maintain data integrity. Dashboard metrics leverage efficient aggregation queries on existing data.
