# Data Models Documentation

## Database Schema Overview

The application uses **PostgreSQL** with **Prisma ORM** for database management. The schema includes comprehensive models for game analytics, user management, and data synchronization.

## Core Models

### User Model

**Table**: `users`

Primary entity for platform users with authentication and authorization.

**Fields**:

- `id` (String, UUID, Primary Key)
- `email` (String, Unique)
- `name` (String)
- `avatar` (String, Optional)
- `subscriptionTier` (SubscriptionTier enum, Default: FREE)
- `role` (UserRole enum, Default: user)
- `themePreference` (String, Optional, Default: "system")
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `lastLogin` (DateTime, Optional)

**Relationships**:

- One-to-Many: `players[]` - Users can have multiple player profiles
- One-to-Many: `clubs[]` - Users can create clubs
- One-to-Many: `tournaments[]` - Users can create tournaments
- One-to-Many: `notifications[]` - User notifications

**Enums**:

- `SubscriptionTier`: FREE, PREMIUM, CLUB, ENTERPRISE
- `UserRole`: guest, user, moderator, admin

---

### Player Model

**Table**: `players`

Represents game players with statistics and judge capabilities.

**Fields**:

- `id` (String, UUID, Primary Key)
- `userId` (String, Foreign Key → User.id)
- `gomafiaId` (String, Unique) - External ID from gomafia.pro
- `name` (String)
- `eloRating` (Int, Default: 1200)
- `totalGames` (Int, Default: 0)
- `wins` (Int, Default: 0)
- `losses` (Int, Default: 0)
- `region` (String, Optional)
- `clubId` (String, Optional, Foreign Key → Club.id)
- `lastSyncAt` (DateTime, Optional)
- `syncStatus` (EntitySyncStatus enum, Optional)

**Judge-Specific Fields**:

- `judgeCategory` (String, Optional) - e.g., "Высшая категория", "1 категория"
- `judgeCanBeGs` (Int, Optional) - Maximum games can be GS
- `judgeCanJudgeFinal` (Boolean, Default: false)
- `judgeMaxTablesAsGs` (Int, Optional) - Maximum tables as GS
- `judgeRating` (Int, Optional) - Judge rating
- `judgeGamesJudged` (Int, Optional) - Number of games judged
- `judgeAccreditationDate` (DateTime, Optional)
- `judgeResponsibleFromSc` (String, Optional) - Responsible from SC FSM

**Relationships**:

- Many-to-One: `user` → User
- Many-to-One: `club` → Club (ClubMembers relation)
- One-to-Many: `participations[]` → GameParticipation
- One-to-Many: `roleStats[]` → PlayerRoleStats
- One-to-Many: `yearStats[]` → PlayerYearStats
- One-to-Many: `tournaments[]` → PlayerTournament
- One-to-Many: `presidingClubs[]` → Club (ClubPresident relation)
- One-to-Many: `chiefJudgedTournaments[]` → Tournament
- One-to-Many: `judgedGames[]` → Game

**Enums**:

- `EntitySyncStatus`: SYNCED, PENDING, ERROR

---

### Club Model

**Table**: `clubs`

Gaming clubs/teams with members and presidents.

**Fields**:

- `id` (String, UUID, Primary Key)
- `gomafiaId` (String, Optional, Unique) - External ID from gomafia.pro
- `name` (String, Unique)
- `region` (String, Optional)
- `presidentId` (String, Optional, Foreign Key → Player.id)
- `description` (String, Optional)
- `logoUrl` (String, Optional)
- `createdBy` (String, Foreign Key → User.id)
- `lastSyncAt` (DateTime, Optional)
- `syncStatus` (EntitySyncStatus enum, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relationships**:

- Many-to-One: `creator` → User
- Many-to-One: `president` → Player (ClubPresident relation)
- One-to-Many: `players[]` → Player (ClubMembers relation)

---

### Game Model

**Table**: `games`

Individual game instances with participants and results.

**Fields**:

- `id` (String, UUID, Primary Key)
- `gomafiaId` (String, Unique) - External ID from gomafia.pro
- `tournamentId` (String, Optional, Foreign Key → Tournament.id)
- `tableNumber` (Int, Optional)
- `judgeId` (String, Optional, Foreign Key → Player.id)
- `date` (DateTime)
- `durationMinutes` (Int, Optional)
- `winnerTeam` (WinnerTeam enum, Optional)
- `status` (GameStatus enum, Default: SCHEDULED)
- `lastSyncAt` (DateTime, Optional)
- `syncStatus` (EntitySyncStatus enum, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relationships**:

- Many-to-One: `tournament` → Tournament
- Many-to-One: `judge` → Player (GameJudge relation)
- One-to-Many: `participations[]` → GameParticipation

**Enums**:

- `GameStatus`: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
- `WinnerTeam`: BLACK, RED, DRAW

---

### GameParticipation Model

**Table**: `game_participations`

Junction table linking players to games with role and performance data.

**Fields**:

- `id` (String, UUID, Primary Key)
- `playerId` (String, Foreign Key → Player.id)
- `gameId` (String, Foreign Key → Game.id)
- `role` (PlayerRole enum)
- `team` (Team enum)
- `isWinner` (Boolean)
- `performanceScore` (Int, Optional)
- `eloChange` (Int, Optional)
- `isFirstShoot` (Boolean, Default: false)
- `firstShootType` (FirstShootType enum, Optional, Default: NONE)

**Relationships**:

- Many-to-One: `player` → Player
- Many-to-One: `game` → Game

**Constraints**:

- Unique constraint on `[playerId, gameId]` - Player can only participate once per game

**Enums**:

- `PlayerRole`: DON, MAFIA, SHERIFF, CITIZEN
- `Team`: BLACK, RED
- `FirstShootType`: NONE, ZERO_MAFIA, ONE_TWO_MAFIA, THREE_MAFIA

---

### Tournament Model

**Table**: `tournaments`

Competitive events with participants and prizes.

**Fields**:

- `id` (String, UUID, Primary Key)
- `gomafiaId` (String, Optional, Unique) - External ID from gomafia.pro
- `name` (String)
- `description` (String, Optional)
- `stars` (Int, Optional)
- `averageElo` (Decimal, Optional)
- `isFsmRated` (Boolean, Default: false)
- `startDate` (DateTime)
- `endDate` (DateTime, Optional)
- `status` (TournamentStatus enum, Default: SCHEDULED)
- `maxParticipants` (Int, Optional)
- `entryFee` (Decimal, Optional)
- `prizePool` (Decimal, Optional)
- `createdBy` (String, Foreign Key → User.id)
- `chiefJudgeId` (String, Optional, Foreign Key → Player.id)
- `lastSyncAt` (DateTime, Optional)
- `syncStatus` (EntitySyncStatus enum, Optional)
- `gameCount` (Int, Optional, Default: 0) - Number of games in tournament
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relationships**:

- Many-to-One: `creator` → User
- Many-to-One: `chiefJudge` → Player (TournamentChiefJudge relation)
- One-to-Many: `games[]` → Game
- One-to-Many: `playerTournaments[]` → PlayerTournament

**Enums**:

- `TournamentStatus`: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

---

### PlayerRoleStats Model

**Table**: `player_role_stats`

Per-role statistics for each player (Don, Mafia, Sheriff, Citizen).

**Fields**:

- `id` (String, UUID, Primary Key)
- `playerId` (String, Foreign Key → Player.id)
- `role` (PlayerRole enum)
- `gamesPlayed` (Int, Default: 0)
- `wins` (Int, Default: 0)
- `losses` (Int, Default: 0)
- `winRate` (Decimal, Default: 0)
- `averagePerformance` (Decimal, Default: 0)
- `lastPlayed` (DateTime, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relationships**:

- Many-to-One: `player` → Player

**Constraints**:

- Unique constraint on `[playerId, role]` - One stat record per player per role

---

### PlayerYearStats Model

**Table**: `player_year_stats`

Yearly aggregated statistics for players.

**Fields**:

- `id` (String, UUID, Primary Key)
- `playerId` (String, Foreign Key → Player.id)
- `year` (Int)
- `totalGames` (Int, Default: 0)
- `donGames` (Int, Default: 0)
- `mafiaGames` (Int, Default: 0)
- `sheriffGames` (Int, Default: 0)
- `civilianGames` (Int, Default: 0)
- `eloRating` (Decimal, Optional)
- `extraPoints` (Decimal, Default: 0)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relationships**:

- Many-to-One: `player` → Player

**Constraints**:

- Unique constraint on `[playerId, year]` - One stat record per player per year

---

### PlayerTournament Model

**Table**: `player_tournaments`

Junction table for player tournament participation with results.

**Fields**:

- `id` (String, UUID, Primary Key)
- `playerId` (String, Foreign Key → Player.id)
- `tournamentId` (String, Foreign Key → Tournament.id)
- `placement` (Int, Optional)
- `ggPoints` (Int, Optional)
- `eloChange` (Int, Optional)
- `prizeMoney` (Decimal, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relationships**:

- Many-to-One: `player` → Player
- Many-to-One: `tournament` → Tournament

**Constraints**:

- Unique constraint on `[playerId, tournamentId]` - Player can only participate once per tournament

---

### Analytics Model

**Table**: `analytics`

Pre-computed analytics metrics cache.

**Fields**:

- `id` (String, UUID, Primary Key)
- `entityType` (EntityType enum)
- `entityId` (String)
- `metricName` (String)
- `metricValue` (Decimal)
- `metricPeriod` (MetricPeriod enum)
- `calculatedAt` (DateTime, Default: now())
- `validUntil` (DateTime, Optional)

**Enums**:

- `EntityType`: PLAYER, CLUB, TOURNAMENT
- `MetricPeriod`: DAILY, WEEKLY, MONTHLY, ALL_TIME

---

### SyncLog Model

**Table**: `sync_logs`

Logging for data synchronization operations.

**Fields**:

- `id` (String, UUID, Primary Key)
- `type` (SyncType enum)
- `status` (SyncStatusEnum enum)
- `startTime` (DateTime, Default: now())
- `endTime` (DateTime, Optional)
- `recordsProcessed` (Int, Optional)
- `errors` (Json, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Enums**:

- `SyncType`: FULL, INCREMENTAL
- `SyncStatusEnum`: RUNNING, COMPLETED, FAILED, CANCELLED

---

### SyncStatus Model

**Table**: `sync_status`

Current synchronization status (singleton table).

**Fields**:

- `id` (String, Default: "current") - Singleton ID
- `lastSyncTime` (DateTime, Optional)
- `lastSyncType` (String, Optional)
- `isRunning` (Boolean, Default: false)
- `progress` (Int, Optional)
- `currentOperation` (String, Optional)
- `lastError` (String, Optional)
- `validationRate` (Float, Optional)
- `totalRecordsProcessed` (Int, Optional)
- `validRecords` (Int, Optional)
- `invalidRecords` (Int, Optional)
- `updatedAt` (DateTime)

---

### ImportCheckpoint Model

**Table**: `import_checkpoints`

Resumability checkpoint for data imports.

**Fields**:

- `id` (String, Default: "current") - Singleton ID
- `currentPhase` (String)
- `currentBatch` (Int)
- `lastProcessedId` (String, Optional)
- `processedIds` (String[])
- `progress` (Int)
- `lastUpdated` (DateTime)
- `createdAt` (DateTime)
- `isPaused` (Boolean, Default: false)

---

### SkippedEntity Model

**Table**: `skipped_entities`

Entities that failed during import/sync with retry capability.

**Fields**:

- `id` (String, UUID, Primary Key)
- `phase` (String)
- `entityType` (String) - 'player', 'page', etc.
- `entityId` (String, Optional) - Player gomafiaId or other entity ID
- `pageNumber` (Int, Optional) - Page number if applicable
- `errorCode` (String)
- `errorMessage` (String)
- `errorDetails` (Json, Optional)
- `retryCount` (Int, Default: 0)
- `lastRetryAt` (DateTime, Optional)
- `status` (String, Default: "PENDING") - PENDING, RETRYING, COMPLETED, FAILED
- `syncLogId` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Indexes**:

- `[phase, status]`
- `[entityType, entityId]`
- `[pageNumber]`

---

### Region Model

**Table**: `regions`

Geographic regions for players and clubs.

**Fields**:

- `id` (String, UUID, Primary Key)
- `code` (String, Unique)
- `name` (String)
- `country` (String, Optional)
- `isActive` (Boolean, Default: true)
- `playerCount` (Int, Default: 0)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

---

### ImportProgress Model

**Table**: `import_progress`

Progress tracking for import operations.

**Fields**:

- `id` (String, UUID, Primary Key)
- `operation` (String)
- `progress` (Int, Default: 0)
- `totalRecords` (Int, Default: 0)
- `processedRecords` (Int, Default: 0)
- `errors` (Int, Default: 0)
- `startTime` (DateTime, Default: now())
- `estimatedCompletion` (DateTime, Optional)
- `status` (ImportStatus enum)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Enums**:

- `ImportStatus`: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED

---

### Notification Model

**Table**: `notifications`

User notifications system.

**Fields**:

- `id` (String, UUID, Primary Key)
- `userId` (String, Foreign Key → User.id, Cascade Delete)
- `type` (NotificationType enum)
- `title` (String)
- `message` (String)
- `details` (Json, Optional)
- `read` (Boolean, Default: false)
- `createdAt` (DateTime)
- `expiresAt` (DateTime, Optional)

**Relationships**:

- Many-to-One: `user` → User (Cascade Delete)

**Indexes**:

- `[userId, read]`
- `[createdAt]`

**Enums**:

- `NotificationType`: SYNC_FAILURE, SYNC_SUCCESS, SYSTEM_ALERT, USER_ACTION

---

### DataIntegrityReport Model

**Table**: `data_integrity_reports`

Reports from data integrity verification processes.

**Fields**:

- `id` (String, UUID, Primary Key)
- `timestamp` (DateTime, Default: now())
- `overallAccuracy` (Float)
- `entities` (Json)
- `discrepancies` (Json, Optional)
- `sampleStrategy` (String, Default: "1_percent")
- `triggerType` (String)
- `status` (String)
- `completedAt` (DateTime, Optional)

**Indexes**:

- `[timestamp]`
- `[status]`

---

### EmailLog Model

**Table**: `email_logs`

Email sending logs with retry tracking.

**Fields**:

- `id` (String, UUID, Primary Key)
- `to` (String[]) - Array of recipient emails
- `subject` (String)
- `type` (String)
- `status` (String)
- `sentAt` (DateTime, Optional)
- `error` (String, Optional)
- `retryCount` (Int, Default: 0)
- `metadata` (Json, Optional)
- `createdAt` (DateTime)

**Indexes**:

- `[status, createdAt]`
- `[type]`

---

### Permission Model

**Table**: `permissions`

RBAC permissions configuration.

**Fields**:

- `id` (String, Primary Key)
- `resource` (String)
- `action` (String)
- `roles` (String[]) - Array of roles with permission
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Constraints**:

- Unique constraint on `[resource, action]` (resource_action)

**Indexes**:

- `[resource, action]`

---

## Database Relationships Summary

### Primary Entity Graph

```
User
├── players[] → Player
├── clubs[] → Club
├── tournaments[] → Tournament
└── notifications[] → Notification

Player
├── user → User
├── club → Club
├── participations[] → GameParticipation
├── roleStats[] → PlayerRoleStats
├── yearStats[] → PlayerYearStats
├── tournaments[] → PlayerTournament
├── presidingClubs[] → Club (president)
├── chiefJudgedTournaments[] → Tournament
└── judgedGames[] → Game

Game
├── tournament → Tournament
├── judge → Player
└── participations[] → GameParticipation

Tournament
├── creator → User
├── chiefJudge → Player
├── games[] → Game
└── playerTournaments[] → PlayerTournament
```

## Database Configuration

- **Provider**: PostgreSQL
- **ORM**: Prisma 5.0.0
- **Connection**: Environment variables `DATABASE_URL` and `DIRECT_URL`
- **Migrations**: Prisma migrations in `prisma/migrations/`
- **Schema Location**: `prisma/schema.prisma`

## Key Design Decisions

1. **Soft Deletes**: Not implemented - uses hard deletes
2. **Audit Trail**: Limited - createdAt/updatedAt timestamps
3. **Sync Tracking**: Comprehensive - `syncStatus` and `lastSyncAt` on syncable entities
4. **Retry Logic**: `SkippedEntity` model for failed imports with retry capability
5. **Checkpointing**: `ImportCheckpoint` for resumable imports
6. **Analytics Cache**: Pre-computed analytics in `Analytics` model
7. **RBAC**: Permission-based with `Permission` model and `UserRole` enum

Generated: 2025-11-22T15:52:49.300Z
