# Data Model: Gomafia Data Integration

**Date**: December 2024  
**Feature**: Gomafia Data Integration  
**Purpose**: Define entities, relationships, and data structure for data synchronization

## Entity Definitions

### SyncLog

**Purpose**: Track synchronization operations and status

**Attributes**:

- `id`: UUID (Primary Key)
- `type`: String (Required) - 'FULL' for complete sync, 'INCREMENTAL' for updates
- `status`: String (Required) - 'RUNNING', 'COMPLETED', 'FAILED'
- `startTime`: DateTime (Required)
- `endTime`: DateTime (Optional)
- `recordsProcessed`: Integer (Optional) - Number of records processed
- `errors`: JSON (Optional) - Array of error objects
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Relationships**:

- Independent entity for tracking sync operations

**Validation Rules**:

- Type must be 'FULL' or 'INCREMENTAL'
- Status must be valid enum value
- Records processed must be >= 0
- End time must be after start time if provided

### SyncStatus

**Purpose**: Current synchronization state for monitoring

**Attributes**:

- `id`: String (Primary Key) - Single record 'current'
- `lastSyncTime`: DateTime (Optional) - Last successful sync
- `lastSyncType`: String (Optional) - Type of last sync
- `isRunning`: Boolean (Default: false) - Whether sync is currently running
- `progress`: Integer (Optional) - Progress percentage (0-100)
- `currentOperation`: String (Optional) - Current operation being performed
- `lastError`: String (Optional) - Last error message
- `updatedAt`: DateTime

**Relationships**:

- Single record tracking current state

**Validation Rules**:

- Progress must be between 0 and 100
- Last sync time must be in the past
- IsRunning must be boolean

### Player

**Purpose**: Individual player from gomafia.pro (already exists, extending)

**Existing Attributes**:

- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key to User)
- `gomafiaId`: String (Unique, Required) - ID from gomafia.pro
- `name`: String (Required)
- `eloRating`: Integer (Default: 1200)
- `totalGames`: Integer (Default: 0)
- `wins`: Integer (Default: 0)
- `losses`: Integer (Default: 0)
- `clubId`: UUID (Foreign Key to Club, Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Additional Attributes for Sync**:

- `lastSyncAt`: DateTime (Optional) - Last time this player was synced from gomafia.pro
- `syncStatus`: String (Optional) - 'SYNCED', 'PENDING', 'ERROR'

**Relationships**:

- Many-to-one with User (player belongs to user)
- Many-to-one with Club (player can belong to club)
- One-to-many with GameParticipation (player participates in games)
- One-to-many with PlayerRoleStats (player has role-specific statistics)

### Game

**Purpose**: Individual game instance (already exists, extending)

**Existing Attributes**:

- `id`: UUID (Primary Key)
- `gomafiaId`: String (Unique, Required) - ID from gomafia.pro
- `tournamentId`: UUID (Foreign Key to Tournament, Optional)
- `date`: DateTime (Required)
- `durationMinutes`: Integer (Optional)
- `winnerTeam`: Enum (Black, Red, Draw)
- `status`: Enum (Scheduled, InProgress, Completed, Cancelled)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Additional Attributes for Sync**:

- `lastSyncAt`: DateTime (Optional) - Last time this game was synced from gomafia.pro
- `syncStatus`: String (Optional) - 'SYNCED', 'PENDING', 'ERROR'

**Relationships**:

- Many-to-one with Tournament (game can belong to tournament)
- One-to-many with GameParticipation (game has participants)

## Database Schema (Prisma)

### New Models

```prisma
model SyncLog {
  id                String    @id @default(uuid())
  type              String    // 'FULL', 'INCREMENTAL'
  status            String    // 'RUNNING', 'COMPLETED', 'FAILED'
  startTime         DateTime  @default(now())
  endTime           DateTime?
  recordsProcessed  Int?
  errors            Json?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@map("sync_logs")
}

model SyncStatus {
  id                String    @id @default("current")
  lastSyncTime      DateTime?
  lastSyncType      String?
  isRunning         Boolean   @default(false)
  progress          Int?
  currentOperation  String?
  lastError         String?
  updatedAt         DateTime  @updatedAt

  @@map("sync_status")
}
```

### Extended Models

```prisma
model Player {
  id                String    @id @default(uuid())
  userId            String
  gomafiaId         String    @unique
  name              String
  eloRating         Int       @default(1200)
  totalGames        Int       @default(0)
  wins              Int       @default(0)
  losses            Int       @default(0)
  clubId            String?
  lastSyncAt        DateTime?
  syncStatus        String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user              User      @relation(fields: [userId], references: [id])
  club              Club?     @relation(fields: [clubId], references: [id])
  participations    GameParticipation[]
  roleStats         PlayerRoleStats[]

  @@map("players")
}

model Game {
  id                String    @id @default(uuid())
  gomafiaId         String    @unique
  tournamentId      String?
  date              DateTime
  durationMinutes   Int?
  winnerTeam        WinnerTeam?
  status            GameStatus @default(SCHEDULED)
  lastSyncAt        DateTime?
  syncStatus        String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  tournament        Tournament? @relation(fields: [tournamentId], references: [id])
  participations    GameParticipation[]

  @@map("games")
}
```

## Data Validation Rules

### Zod Schemas

```typescript
// SyncLog validation
const SyncLogSchema = z.object({
  type: z.enum(['FULL', 'INCREMENTAL']),
  status: z.enum(['RUNNING', 'COMPLETED', 'FAILED']),
  startTime: z.date(),
  endTime: z.date().optional(),
  recordsProcessed: z.number().int().min(0).optional(),
  errors: z.array(z.any()).optional(),
});

// Player validation (extended)
const PlayerSchema = z
  .object({
    gomafiaId: z.string().min(1),
    name: z.string().min(2).max(50),
    eloRating: z.number().int().min(0).max(3000),
    totalGames: z.number().int().min(0),
    wins: z.number().int().min(0),
    losses: z.number().int().min(0),
    lastSyncAt: z.date().optional(),
    syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
  })
  .refine((data) => data.wins + data.losses <= data.totalGames, {
    message: 'Wins + losses cannot exceed total games',
  })
  .refine((data) => data.wins + data.losses === data.totalGames, {
    message: 'Wins + losses must equal total games',
  });

// Game validation (extended)
const GameSchema = z.object({
  gomafiaId: z.string().min(1),
  date: z.date(),
  durationMinutes: z.number().int().positive().optional(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  lastSyncAt: z.date().optional(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
});
```

## State Transitions

### Sync Status Flow

```
Not Running → Running → Completed
    ↓            ↓
  Failed      Failed
```

### Sync Types

- **FULL**: Complete import of all data from gomafia.pro
- **INCREMENTAL**: Update only changed records since last sync

### Sync Statuses

- **RUNNING**: Sync operation is currently in progress
- **COMPLETED**: Sync operation finished successfully
- **FAILED**: Sync operation encountered errors and did not complete

## Data Relationships Summary

1. **SyncLog** → Independent entity tracking sync operations
2. **SyncStatus** → Single record tracking current sync state
3. **Player** → Extended with sync tracking fields
4. **Game** → Extended with sync tracking fields
5. **GameParticipation** → No changes needed for sync

## Indexes and Performance

### Database Indexes

- `sync_logs.createdAt` (index for time-based queries)
- `sync_logs.status` (index for filtering by status)
- `players.lastSyncAt` (index for incremental sync queries)
- `players.syncStatus` (index for filtering by sync status)
- `games.lastSyncAt` (index for incremental sync queries)
- `games.syncStatus` (index for filtering by sync status)
- `players.gomafiaId` (already exists - unique index)
- `games.gomafiaId` (already exists - unique index)

### Query Optimization

- Use database transactions for batch operations
- Batch inserts for improved performance
- Cache sync status in Redis
- Use database views for complex sync queries

## Data Migration Strategy

### Initial Data Import

1. Run full sync to import all historical data
2. Mark all imported records with sync status 'SYNCED'
3. Update sync logs with completion status
4. Set last sync time in sync status

### Ongoing Data Sync

1. Daily scheduled incremental sync
2. Fetch only changed records based on lastSyncAt
3. Update existing records or insert new ones
4. Update sync status and logs
5. Handle errors gracefully with retry logic

This data model extends the existing schema to support comprehensive data synchronization from gomafia.pro while maintaining data integrity and enabling efficient incremental updates.
