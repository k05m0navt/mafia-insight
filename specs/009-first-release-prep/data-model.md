# Data Model: First Production Release Preparation

**Feature**: 009-first-release-prep  
**Date**: October 30, 2025  
**Status**: Complete

## Overview

This document defines the database schema updates required for the first production release preparation feature. The changes extend the existing Prisma schema to support admin management, profile management, sync notifications, and data verification.

## Schema Changes

### 1. User Model Extensions

**Purpose**: Support admin bootstrapping, profile management, and avatar storage.

**Changes**:

- Verify `avatar` field exists (String?, stores Supabase Storage public URL)
- Verify `name` field is properly used in signup flow
- Verify `role` enum includes `admin` value
- Verify `lastLogin` field exists for tracking

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  name            String    // [VERIFY] Ensure signup stores name
  avatar          String?   // [VERIFY] Stores Supabase Storage public URL
  subscriptionTier SubscriptionTier @default(FREE)
  role            UserRole  @default(user) // [VERIFY] Includes admin enum value
  themePreference String?   @default("system")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastLogin       DateTime? // [VERIFY] Updated on each login

  players         Player[]
  clubs           Club[]
  tournaments     Tournament[]
  notifications   Notification[] // [NEW] Relation to notifications

  @@map("users")
}

enum UserRole {
  guest
  user
  moderator
  admin // [VERIFY] Ensure this exists
}
```

**Migration Notes**:

- No migration needed if schema already matches
- If `avatar` missing: Add nullable column, defaults to NULL
- If `notifications` relation missing: Add after creating Notification model

---

### 2. Notification Model (NEW)

**Purpose**: Store in-app notifications for administrators about sync failures and system alerts.

**Schema**:

```prisma
model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  details   Json?            // Additional structured data (sync logs, error details)
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())
  expiresAt DateTime?        // Optional expiration for temporary notifications

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read]) // Optimize for querying unread notifications
  @@index([createdAt])    // Optimize for time-based queries
  @@map("notifications")
}

enum NotificationType {
  SYNC_FAILURE
  SYNC_SUCCESS
  SYSTEM_ALERT
  USER_ACTION
}
```

**Validation Rules**:

- `userId` MUST reference existing user
- `type` MUST be valid enum value
- `title` MUST be non-empty (max 255 characters)
- `message` MUST be non-empty (max 2000 characters)
- `details` JSON structure varies by notification type
- `read` defaults to false, updated when user views notification
- `expiresAt` if set, notification auto-deletes after expiration

**Relationships**:

- One User has many Notifications (one-to-many)
- Notifications CASCADE delete when User is deleted

---

### 3. SyncLog Model Extensions

**Purpose**: Ensure sync logs support comprehensive error tracking and notification integration.

**Verify Existing Schema**:

```prisma
model SyncLog {
  id                String         @id @default(uuid())
  type              SyncType       // FULL or INCREMENTAL
  status            SyncStatusEnum // RUNNING, COMPLETED, FAILED, CANCELLED
  startTime         DateTime       @default(now())
  endTime           DateTime?
  recordsProcessed  Int?
  errors            Json?          // [VERIFY] Stores detailed error information
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  @@index([status, startTime]) // Optimize for status queries
  @@map("sync_logs")
}

enum SyncType {
  FULL
  INCREMENTAL
}

enum SyncStatusEnum {
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

**No Changes Required**: Existing schema supports all required functionality.

---

### 4. SyncStatus Model Extensions

**Purpose**: Track real-time sync status and validation metrics.

**Verify Existing Schema**:

```prisma
model SyncStatus {
  id                     String    @id @default("current")
  lastSyncTime           DateTime?
  lastSyncType           String?
  isRunning              Boolean   @default(false)
  progress               Int?
  currentOperation       String?
  lastError              String?
  validationRate         Float?    // [VERIFY] Percentage of records passing validation
  totalRecordsProcessed  Int?
  validRecords           Int?
  invalidRecords         Int?
  updatedAt              DateTime  @updatedAt

  @@map("sync_status")
}
```

**No Changes Required**: Existing schema supports validation metrics.

---

### 5. DataIntegrityReport Model (NEW)

**Purpose**: Store data verification results comparing imported data against gomafia.pro source.

**Schema**:

```prisma
model DataIntegrityReport {
  id              String   @id @default(uuid())
  timestamp       DateTime @default(now())
  overallAccuracy Float    // Percentage (0-100)
  entities        Json     // Array of entity verification results
  discrepancies   Json?    // Detailed discrepancy information
  sampleStrategy  String   @default("1_percent") // e.g., "1_percent", "100_random"
  triggerType     String   // "POST_IMPORT", "SCHEDULED", "MANUAL"
  status          String   // "IN_PROGRESS", "COMPLETED", "FAILED"
  completedAt     DateTime?

  @@index([timestamp])
  @@index([status])
  @@map("data_integrity_reports")
}
```

**Entities JSON Structure**:

```json
[
  {
    "type": "PLAYER",
    "sampleSize": 100,
    "totalRecords": 10000,
    "matches": 99,
    "accuracy": 99.0,
    "discrepancies": 1
  },
  {
    "type": "GAME",
    "sampleSize": 500,
    "totalRecords": 50000,
    "matches": 495,
    "accuracy": 99.0,
    "discrepancies": 5
  }
]
```

**Validation Rules**:

- `overallAccuracy` MUST be between 0 and 100
- `sampleStrategy` documents sampling method used
- `triggerType` documents what initiated the verification
- `status` tracks verification progress
- `completedAt` set when verification finishes

---

### 6. EmailLog Model (NEW)

**Purpose**: Track all email notifications sent to administrators for audit and debugging.

**Schema**:

```prisma
model EmailLog {
  id          String   @id @default(uuid())
  to          String[] // Array of recipient email addresses
  subject     String
  type        String   // "SYNC_FAILURE_ALERT", "ADMIN_INVITE", etc.
  status      String   // "SENT", "FAILED", "PENDING"
  sentAt      DateTime?
  error       String?
  retryCount  Int      @default(0)
  metadata    Json?    // Additional context (sync log ID, notification ID, etc.)
  createdAt   DateTime @default(now())

  @@index([status, createdAt])
  @@index([type])
  @@map("email_logs")
}
```

**Validation Rules**:

- `to` MUST contain at least one valid email address
- `subject` MUST be non-empty (max 255 characters)
- `type` documents email purpose for filtering/reporting
- `status` tracks delivery status
- `retryCount` increments on retry attempts (max 3)
- `metadata` stores contextual information for debugging

---

## Entity Relationships Diagram

```
User (existing, extended)
  ├─ has many → Notification (NEW)
  ├─ has many → Player (existing)
  ├─ has many → Club (existing)
  └─ has many → Tournament (existing)

Notification (NEW)
  └─ belongs to → User

SyncLog (existing, verified)
  └─ independent entity

SyncStatus (existing, verified)
  └─ singleton entity (id = "current")

DataIntegrityReport (NEW)
  └─ independent entity (historical records)

EmailLog (NEW)
  └─ independent entity (audit log)
```

## Migration Strategy

### Phase 1: Add New Models (Non-Breaking)

```bash
# Create migration for new models
yarn prisma migrate dev --name add_notifications_and_reports

# Migration will create:
# - Notification table
# - DataIntegrityReport table
# - EmailLog table
# - NotificationType enum
```

### Phase 2: Verify Existing Schema

```bash
# Verify User model has required fields
# Verify SyncLog has errors field
# Verify SyncStatus has validation fields
# No migration needed if already present
```

### Phase 3: Seed Initial Data (if needed)

```typescript
// prisma/seed.ts extension
async function seedNotificationDefaults() {
  // No default notifications needed
  // Will be created dynamically by sync failures
}

async function seedFirstAdmin() {
  // Only if using database seeding approach
  // Prefer CLI script or bootstrap page instead
}
```

## Data Access Patterns

### 1. Admin Notification Creation

```typescript
// When sync fails, create notifications for all admins
const admins = await prisma.user.findMany({
  where: { role: 'admin' },
  select: { id: true, email: true },
});

await prisma.notification.createMany({
  data: admins.map((admin) => ({
    userId: admin.id,
    type: 'SYNC_FAILURE',
    title: 'Data Sync Failed',
    message: `Sync failed at ${new Date().toISOString()}`,
    details: { syncLogId: syncLog.id },
  })),
});
```

### 2. Unread Notifications Query

```typescript
// Get unread notifications for a user
const unreadCount = await prisma.notification.count({
  where: {
    userId: user.id,
    read: false,
  },
});

const notifications = await prisma.notification.findMany({
  where: {
    userId: user.id,
    read: false,
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

### 3. Data Integrity Report Creation

```typescript
const report = await prisma.dataIntegrityReport.create({
  data: {
    overallAccuracy: 99.2,
    entities: JSON.stringify([
      { type: 'PLAYER', sampleSize: 100, matches: 99, accuracy: 99.0 },
      { type: 'GAME', sampleSize: 500, matches: 497, accuracy: 99.4 },
    ]),
    sampleStrategy: '1_percent',
    triggerType: 'POST_IMPORT',
    status: 'COMPLETED',
    completedAt: new Date(),
  },
});
```

### 4. Email Audit Log

```typescript
const emailLog = await prisma.emailLog.create({
  data: {
    to: adminEmails,
    subject: 'Data Sync Failed',
    type: 'SYNC_FAILURE_ALERT',
    status: 'SENT',
    sentAt: new Date(),
    metadata: { syncLogId: syncLog.id, notificationId: notification.id },
  },
});
```

## Performance Considerations

### Indexes

All new models include appropriate indexes:

- `Notification`: Indexed on `(userId, read)` and `createdAt` for fast queries
- `DataIntegrityReport`: Indexed on `timestamp` and `status` for historical queries
- `EmailLog`: Indexed on `(status, createdAt)` and `type` for filtering

### Cascading Deletes

- Notifications CASCADE delete when User is deleted (cleanup orphaned notifications)
- Other models are independent (no CASCADE needed)

### JSON Field Usage

- `Notification.details`: Small JSON, acceptable for notification context
- `DataIntegrityReport.entities`: Array of objects, consider size limits
- `EmailLog.metadata`: Small JSON for debugging context

### Query Optimization

- Use `select` to retrieve only needed fields
- Use `include` carefully to avoid N+1 queries
- Paginate notification lists (e.g., 10-20 per page)
- Archive old notifications/logs after 90 days

## Validation Rules Summary

| Model               | Field           | Validation                    |
| ------------------- | --------------- | ----------------------------- |
| User                | name            | Required, max 255 chars       |
| User                | avatar          | Valid URL to Supabase Storage |
| User                | email           | Valid email format, unique    |
| Notification        | title           | Required, max 255 chars       |
| Notification        | message         | Required, max 2000 chars      |
| DataIntegrityReport | overallAccuracy | 0-100 float                   |
| EmailLog            | to              | Array of valid emails         |
| EmailLog            | retryCount      | 0-3 integer                   |

## Migration Checklist

- [ ] Create migration with `yarn prisma migrate dev --name add_notifications_and_reports`
- [ ] Verify migration in test environment
- [ ] Test notification creation for admins
- [ ] Test data integrity report creation
- [ ] Test email log creation
- [ ] Verify indexes exist with `EXPLAIN ANALYZE` queries
- [ ] Run Prisma Studio to inspect new tables
- [ ] Update TypeScript types with `yarn prisma generate`
- [ ] Test rollback procedure
- [ ] Document migration in deployment checklist

---

**Status**: Ready for implementation  
**Dependencies**: None (extends existing schema)  
**Risk**: Low (additive changes only, no breaking modifications)
