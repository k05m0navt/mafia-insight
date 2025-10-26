# Data Model: GoMafia Initial Data Import

**Feature**: 003-gomafia-data-import  
**Date**: October 25, 2025  
**Updated**: October 26, 2025

## Overview

This document defines the data model for the initial import feature. Based on detailed analysis of gomafia.pro structure (Session 2025-10-26), this feature now requires **schema changes** to support comprehensive data import including:

- Player region information and year-specific statistics
- Club region, president, and members with gomafiaId
- Tournament metadata (stars, average ELO, FSM rating) with gomafiaId
- Player-tournament relationships with prize money

## Schema Changes Required

### Summary of Changes

**Modified Models**:

- `Player`: Add `region` field (String, nullable)
- `Club`: Add `gomafiaId` (String, unique), `region` (String, nullable), `presidentId` (String, nullable), `lastSyncAt`, `syncStatus`
- `Tournament`: Add `gomafiaId` (String, unique), `stars` (Int), `averageElo` (Decimal), `isFsmRated` (Boolean), `lastSyncAt`, `syncStatus`

**New Models**:

- `PlayerYearStats`: Year-specific player statistics (games by role per year, ELO, extra points)
- `PlayerTournament`: Player-tournament participation with placement, GG points, ELO change, prize money

---

## Modified Entities

### Player _(MODIFIED)_

**Purpose**: Represents individual mafia players from gomafia.pro

**Fields**:

- `id`: UUID, primary key
- `userId`: String, foreign key to User
- `gomafiaId`: String, unique identifier from gomafia.pro (UNIQUE constraint)
- `name`: String, player display name
- `eloRating`: Int, default 1200, player skill rating
- `totalGames`: Int, default 0, total games played
- `wins`: Int, default 0, total wins
- `losses`: Int, default 0, total losses
- **`region`**: String, nullable, **[NEW]** player's region from gomafia.pro (e.g., "Москва", "Санкт-Петербург")
- `clubId`: String, nullable, foreign key to Club
- `lastSyncAt`: DateTime, nullable, timestamp of last sync
- `syncStatus`: EntitySyncStatus, nullable, sync state (SYNCED/PENDING/ERROR)
- `createdAt`: DateTime, creation timestamp
- `updatedAt`: DateTime, last update timestamp

**Initial Import Behavior**:

- **Duplicate Detection**: Check `gomafiaId` uniqueness before insert
- **Sync Marking**: Set `syncStatus = "SYNCED"` and `lastSyncAt = now()` on successful import
- **Region Extraction**: Parse from `/rating` endpoint player list
- **User Association**: Associate with system user (or create default import user)
- **Club Association**: Link to Club via club name matching after clubs are imported

**Validation Rules**:

- `gomafiaId`: Non-empty string (required for uniqueness)
- `name`: 2-50 characters
- `eloRating`: 0-5000 range (gomafia.pro uses higher ratings than initially assumed)
- `totalGames`, `wins`, `losses`: Non-negative integers
- `region`: Optional, 2-100 characters if present

**Relationships**:

- Belongs to User (via `userId`)
- Belongs to Club (via `clubId`, optional)
- Has many GameParticipations
- Has many PlayerRoleStats
- **Has many PlayerYearStats** [NEW]
- **Has many PlayerTournaments** [NEW]

**Migration SQL**:

```sql
ALTER TABLE players ADD COLUMN region VARCHAR(100);
```

---

### Club _(MODIFIED)_

**Purpose**: Represents mafia clubs from gomafia.pro

**Fields**:

- `id`: UUID, primary key
- **`gomafiaId`**: String, **[NEW]** unique identifier from gomafia.pro (UNIQUE constraint)
- `name`: String, unique, club name
- **`region`**: String, nullable, **[NEW]** club's region from gomafia.pro
- **`presidentId`**: String, nullable, **[NEW]** foreign key to Player (club president)
- `description`: String, nullable, club description
- `logoUrl`: String, nullable, club logo URL
- `createdBy`: String, foreign key to User
- **`lastSyncAt`**: DateTime, nullable, **[NEW]** timestamp of last sync
- **`syncStatus`**: EntitySyncStatus, nullable, **[NEW]** sync state
- `createdAt`: DateTime, creation timestamp
- `updatedAt`: DateTime, last update timestamp

**Initial Import Behavior**:

- **Duplicate Detection**: Check `gomafiaId` uniqueness before insert
- **Sync Marking**: Set `syncStatus = "SYNCED"` and `lastSyncAt = now()`
- **Region Extraction**: Parse from `/rating?tab=clubs` endpoint
- **President Linking**: Link to Player after all players are imported (by name matching or gomafiaId)
- **Members Import**: Import from `/club/{id}` endpoint with pagination

**Validation Rules**:

- `gomafiaId`: Non-empty string (required for uniqueness)
- `name`: 2-100 characters, unique
- `region`: Optional, 2-100 characters if present
- `presidentId`: Must reference existing Player if present

**Relationships**:

- Belongs to User (via `createdBy`)
- **Belongs to Player (president)** (via `presidentId`) [NEW]
- Has many Players (members)

**Migration SQL**:

```sql
ALTER TABLE clubs ADD COLUMN gomafiaId VARCHAR(100) UNIQUE;
ALTER TABLE clubs ADD COLUMN region VARCHAR(100);
ALTER TABLE clubs ADD COLUMN presidentId VARCHAR(36);
ALTER TABLE clubs ADD COLUMN lastSyncAt TIMESTAMP;
ALTER TABLE clubs ADD COLUMN syncStatus VARCHAR(20);
ALTER TABLE clubs ADD CONSTRAINT fk_club_president FOREIGN KEY (presidentId) REFERENCES players(id);
```

---

### Tournament _(MODIFIED)_

**Purpose**: Tournament records from gomafia.pro

**Fields**:

- `id`: UUID, primary key
- **`gomafiaId`**: String, **[NEW]** unique identifier from gomafia.pro (UNIQUE constraint)
- `name`: String, tournament name
- `description`: String, nullable, tournament description
- **`stars`**: Int, nullable, **[NEW]** tournament star rating (0-5)
- **`averageElo`**: Decimal, nullable, **[NEW]** average ELO of participants
- **`isFsmRated`**: Boolean, default false, **[NEW]** whether tournament counts for FSM rating
- `startDate`: DateTime, tournament start date
- `endDate`: DateTime, nullable, tournament end date
- `status`: TournamentStatus, tournament status
- `maxParticipants`: Int, nullable, maximum participants
- `entryFee`: Decimal, nullable, entry fee amount
- `prizePool`: Decimal, nullable, total prize pool
- `createdBy`: String, foreign key to User
- **`lastSyncAt`**: DateTime, nullable, **[NEW]** timestamp of last sync
- **`syncStatus`**: EntitySyncStatus, nullable, **[NEW]** sync state
- `createdAt`: DateTime, creation timestamp
- `updatedAt`: DateTime, last update timestamp

**Initial Import Behavior**:

- **Duplicate Detection**: Check `gomafiaId` uniqueness before insert
- **Sync Marking**: Set `syncStatus = "SYNCED"` and `lastSyncAt = now()`
- **Metadata Extraction**: Parse stars, averageElo, isFsmRated from `/tournaments` list
- **Status Detection**: Parse from gomafia.pro (SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED)
- **Participants Import**: Import from `/tournament/{id}?tab=tournament`
- **Games Import**: Import from `/tournament/{id}?tab=games`

**Validation Rules**:

- `gomafiaId`: Non-empty string (required for uniqueness)
- `name`: 2-200 characters
- `stars`: 0-5 range if present
- `averageElo`: 0-5000 range if present
- `isFsmRated`: Boolean (default false)
- `startDate`: Required
- `status`: Must be valid TournamentStatus enum value

**Relationships**:

- Belongs to User (via `createdBy`)
- Has many Games
- **Has many PlayerTournaments** [NEW]

**Migration SQL**:

```sql
ALTER TABLE tournaments ADD COLUMN gomafiaId VARCHAR(100) UNIQUE;
ALTER TABLE tournaments ADD COLUMN stars INT;
ALTER TABLE tournaments ADD COLUMN averageElo DECIMAL(10,2);
ALTER TABLE tournaments ADD COLUMN isFsmRated BOOLEAN DEFAULT FALSE;
ALTER TABLE tournaments ADD COLUMN lastSyncAt TIMESTAMP;
ALTER TABLE tournaments ADD COLUMN syncStatus VARCHAR(20);
```

---

## New Entities

### PlayerYearStats _(NEW MODEL)_

**Purpose**: Stores year-specific statistics per player

**Fields**:

- `id`: UUID, primary key
- `playerId`: String, foreign key to Player
- `year`: Int, statistics year (e.g., 2025, 2024)
- `totalGames`: Int, default 0, total games played in year
- `donGames`: Int, default 0, games played as DON
- `mafiaGames`: Int, default 0, games played as MAFIA
- `sheriffGames`: Int, default 0, games played as SHERIFF
- `civilianGames`: Int, default 0, games played as CIVILIAN
- `eloRating`: Decimal, nullable, ELO rating for the year (without rounding)
- `extraPoints`: Decimal, default 0, extra points earned (дополнительные баллы)
- `createdAt`: DateTime, creation timestamp
- `updatedAt`: DateTime, last update timestamp

**Unique Constraint**: `(playerId, year)` - one stats record per player per year

**Initial Import Behavior**:

- **Source**: Scraped from `/stats/{id}` with year selector
- **Year Iteration**: Loop through all available years (2025, 2024, 2023, ...)
- **Dynamic Loading**: Wait for page content to update after year selection
- **Upsert Strategy**: Update existing stats or create new ones

**Validation Rules**:

- `playerId`: Must reference existing Player
- `year`: 2000-2100 range
- All game counts: Non-negative integers
- `eloRating`: 0-5000 range if present
- `extraPoints`: Decimal, non-negative

**Relationships**:

- Belongs to Player

**Calculation Logic**:

```typescript
// Example scraping logic
async function scrapePlayerYearStats(gomafiaId: string, year: number) {
  await page.goto(`https://gomafia.pro/stats/${gomafiaId}`);

  // Select year
  await page.click(`button:has-text("${year}")`);
  await page.waitForLoadState('networkidle');

  // Extract stats
  return {
    totalGames: parseInt(await page.textContent('.total-games')),
    donGames: parseInt(await page.textContent('.don-games')),
    mafiaGames: parseInt(await page.textContent('.mafia-games')),
    sheriffGames: parseInt(await page.textContent('.sheriff-games')),
    civilianGames: parseInt(await page.textContent('.civilian-games')),
    eloRating: parseFloat(await page.textContent('.elo-rating')),
    extraPoints: parseFloat(await page.textContent('.extra-points')),
  };
}
```

**Prisma Schema**:

```prisma
model PlayerYearStats {
  id            String   @id @default(uuid())
  playerId      String
  year          Int
  totalGames    Int      @default(0)
  donGames      Int      @default(0)
  mafiaGames    Int      @default(0)
  sheriffGames  Int      @default(0)
  civilianGames Int      @default(0)
  eloRating     Decimal?
  extraPoints   Decimal  @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  player        Player   @relation(fields: [playerId], references: [id])

  @@unique([playerId, year])
  @@map("player_year_stats")
}
```

---

### PlayerTournament _(NEW MODEL)_

**Purpose**: Join table linking players to tournaments with participation details

**Fields**:

- `id`: UUID, primary key
- `playerId`: String, foreign key to Player
- `tournamentId`: String, foreign key to Tournament
- `placement`: Int, nullable, player's final placement/rank
- `ggPoints`: Int, nullable, GG points earned
- `eloChange`: Int, nullable, ELO rating change
- `prizeMoney`: Decimal, nullable, prize money won in rubles (₽)
- `createdAt`: DateTime, creation timestamp
- `updatedAt`: DateTime, last update timestamp

**Unique Constraint**: `(playerId, tournamentId)` - one participation record per player per tournament

**Initial Import Behavior**:

- **Source**: Scraped from `/stats/{playerId}?tab=history` with pagination
- **Prize Parsing**: Extract from "Призовые" column (e.g., "60000 ₽" → 60000.00)
- **Batch Processing**: Process in batches to handle large tournament histories
- **Tournament Linking**: Must reference existing Tournament records

**Validation Rules**:

- `playerId`: Must reference existing Player
- `tournamentId`: Must reference existing Tournament
- `placement`: Positive integer if present
- `ggPoints`: Integer (can be negative for poor performance)
- `eloChange`: Integer (can be negative or positive)
- `prizeMoney`: Non-negative Decimal if present
- Unique constraint enforced: `(playerId, tournamentId)`

**Relationships**:

- Belongs to Player
- Belongs to Tournament

**Calculation Logic**:

```typescript
// Example scraping logic
async function scrapePlayerTournamentHistory(gomafiaId: string) {
  const results = [];
  let page = 1;

  while (true) {
    await page.goto(
      `https://gomafia.pro/stats/${gomafiaId}?tab=history&page=${page}`
    );

    const tournaments = await page.$$eval('table tbody tr', (rows) =>
      rows.map((row) => ({
        tournamentName: row.querySelector('.tournament-name')?.textContent,
        placement: parseInt(row.querySelector('.placement')?.textContent),
        ggPoints: parseInt(row.querySelector('.gg-points')?.textContent),
        eloChange: parseInt(row.querySelector('.elo-change')?.textContent),
        prizeMoney: parsePrizeMoney(row.querySelector('.prize')?.textContent),
      }))
    );

    results.push(...tournaments);

    // Check if there's a next page
    const hasNextPage = await page.$('.pagination .next:not(.disabled)');
    if (!hasNextPage) break;
    page++;
  }

  return results;
}

function parsePrizeMoney(text: string): number | null {
  if (!text || text === '–') return null;
  // "60000 ₽" → 60000.00
  return parseFloat(text.replace(/[^\d.]/g, ''));
}
```

**Prisma Schema**:

```prisma
model PlayerTournament {
  id           String      @id @default(uuid())
  playerId     String
  tournamentId String
  placement    Int?
  ggPoints     Int?
  eloChange    Int?
  prizeMoney   Decimal?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  player       Player      @relation(fields: [playerId], references: [id])
  tournament   Tournament  @relation(fields: [tournamentId], references: [id])

  @@unique([playerId, tournamentId])
  @@map("player_tournaments")
}
```

---

## Existing Entities (Unchanged)

The following entities remain unchanged from the original schema:

### Game

**Purpose**: Individual game records

**Fields**: (No changes - see `prisma/schema.prisma`)

**Import Source**:

- `/tournament/{id}?tab=games` for tournament games
- Games already linked to tournaments via `tournamentId`

---

### GameParticipation

**Purpose**: Links players to games with role and outcome

**Fields**: (No changes - see `prisma/schema.prisma`)

**Import Source**: Created when importing game details

---

### SyncLog

**Purpose**: Records history of sync/import operations

**Fields**: (No changes - see `prisma/schema.prisma`)

**Usage**: Track FULL import operations with detailed metrics

---

### SyncStatus

**Purpose**: Tracks current sync/import operation state (singleton)

**Fields**: (No changes - see `prisma/schema.prisma`)

**Usage**: Progress tracking with checkpoint data for resume capability

---

### PlayerRoleStats

**Purpose**: Aggregated statistics per player per role

**Fields**: (No changes - see `prisma/schema.prisma`)

**Usage**: Calculated after importing all games and participations

---

## Data Flow During Initial Import

### Import Phases

**Phase 1: Clubs**

1. Fetch clubs list from `/rating?tab=clubs` (all years, all regions)
2. Check for existing clubs (by `gomafiaId`)
3. Import new clubs in batches (100 per batch)
4. For each club, fetch details from `/club/{id}` including president and members
5. Mark each club as `syncStatus = "SYNCED"`

**Phase 2: Players**

1. Fetch player list from `/rating` (all years, all regions)
2. Check for existing players (by `gomafiaId`)
3. Import new players in batches (100 per batch)
4. Link players to clubs (by club name matching)
5. Mark each player as `syncStatus = "SYNCED"`

**Phase 3: Player Year Stats**

1. For each player, iterate through years (2025, 2024, 2023, ...)
2. Fetch `/stats/{id}` and select each year
3. Wait for dynamic content to load
4. Extract year-specific statistics
5. Upsert PlayerYearStats records

**Phase 4: Tournaments**

1. Fetch tournaments list from `/tournaments` (all time filters, FSM filters)
2. Check for existing tournaments (by `gomafiaId`)
3. Import new tournaments in batches (100 per batch)
4. Mark each tournament as `syncStatus = "SYNCED"`

**Phase 5: Player Tournament History**

1. For each player, fetch `/stats/{id}?tab=history` with pagination
2. Extract tournament participation data
3. Link to existing Tournament records
4. Import PlayerTournament records in batches

**Phase 6: Games**

1. For each tournament, fetch `/tournament/{id}?tab=games`
2. Check for existing games (by `gomafiaId`)
3. Import new games in batches (100 per batch)
4. For each game, create GameParticipation records
5. Mark each game as `syncStatus = "SYNCED"`

**Phase 7: Statistics Calculation**

1. Calculate PlayerRoleStats for all players
2. Upsert stats in batches

### Checkpoint Strategy

After each batch completion:

```typescript
await db.$transaction(async (tx) => {
  // 1. Import batch records
  await tx.player.createMany({ data: batchData });

  // 2. Update checkpoint
  await tx.syncStatus.update({
    where: { id: 'current' },
    data: {
      progress: newProgress,
      currentOperation: JSON.stringify({
        phase: 'PLAYERS',
        lastBatchIndex: 15,
        totalBatches: 50,
        processedIds: [...],
        message: 'Importing players: batch 15/50'
      })
    }
  });
});
```

---

## Validation Summary

### Data Quality Requirements (SC-002)

**Target**: 98% of imported records pass validation

**Validation Points**:

1. **Schema validation**: Zod schemas for all entity types
2. **Uniqueness**: gomafiaId must be unique for Player, Club, Tournament
3. **Referential integrity**: All foreign keys must reference valid records
4. **Business rules**:
   - Each game has ≥2 participations
   - Player has valid name, elo rating in range
   - Tournament dates are logical (startDate ≤ endDate)
   - Prize money is non-negative
   - Year stats year is reasonable (2000-2100)

**Metrics Tracking**:

```typescript
interface ValidationMetrics {
  totalFetched: number;
  validRecords: number;
  invalidRecords: number;
  duplicatesSkipped: number;
  validationRate: number; // (validRecords / totalFetched) * 100
}
```

**Success Criteria**: `validationRate >= 98%`

---

## Schema Diagram

```text
┌─────────────────┐
│      User       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐         ┌─────────────────┐
│     Player      │◄───────┤  PlayerRoleStats│
│  (gomafiaId*)   │   1:N   └─────────────────┘
│  +region        │
└────┬─────┬──────┘
     │     │
     │     │ 1:N
     │     ▼
     │   ┌──────────────────┐
     │   │ PlayerYearStats  │ [NEW]
     │   └──────────────────┘
     │
     │ 1:N
     ▼
┌──────────────────┐         ┌─────────────────┐
│     Club         │◄────────│     Player      │
│  (gomafiaId*)    │   N:1   │  (president)    │
│  +region         │         └─────────────────┘
│  +presidentId    │
└──────────────────┘

┌──────────────────┐         ┌─────────────────┐
│   Tournament     │◄───────┤PlayerTournament │ [NEW]
│  (gomafiaId*)    │   1:N   │  +prizeMoney    │
│  +stars          │         └────────┬────────┘
│  +averageElo     │                  │
│  +isFsmRated     │                  │ N:1
└────────┬─────────┘                  │
         │                            │
         │ 1:N                        │
         ▼                            ▼
┌──────────────────┐         ┌─────────────────┐
│      Game        │         │     Player      │
│  (gomafiaId*)    │         └─────────────────┘
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│GameParticipation │
│  (playerId,      │
│   gameId)*       │
└──────────────────┘

Legend:
* = Unique constraint
─ = Foreign key relationship
+ = New field
```

---

## Migration Script

Complete migration to add all required fields and tables:

```sql
-- Add region to players
ALTER TABLE players ADD COLUMN region VARCHAR(100);

-- Add new fields to clubs
ALTER TABLE clubs ADD COLUMN gomafiaId VARCHAR(100) UNIQUE;
ALTER TABLE clubs ADD COLUMN region VARCHAR(100);
ALTER TABLE clubs ADD COLUMN presidentId VARCHAR(36);
ALTER TABLE clubs ADD COLUMN lastSyncAt TIMESTAMP;
ALTER TABLE clubs ADD COLUMN syncStatus VARCHAR(20);
ALTER TABLE clubs ADD CONSTRAINT fk_club_president FOREIGN KEY (presidentId) REFERENCES players(id);

-- Add new fields to tournaments
ALTER TABLE tournaments ADD COLUMN gomafiaId VARCHAR(100) UNIQUE;
ALTER TABLE tournaments ADD COLUMN stars INT;
ALTER TABLE tournaments ADD COLUMN averageElo DECIMAL(10,2);
ALTER TABLE tournaments ADD COLUMN isFsmRated BOOLEAN DEFAULT FALSE;
ALTER TABLE tournaments ADD COLUMN lastSyncAt TIMESTAMP;
ALTER TABLE tournaments ADD COLUMN syncStatus VARCHAR(20);

-- Create PlayerYearStats table
CREATE TABLE player_year_stats (
  id VARCHAR(36) PRIMARY KEY,
  playerId VARCHAR(36) NOT NULL,
  year INT NOT NULL,
  totalGames INT DEFAULT 0,
  donGames INT DEFAULT 0,
  mafiaGames INT DEFAULT 0,
  sheriffGames INT DEFAULT 0,
  civilianGames INT DEFAULT 0,
  eloRating DECIMAL(10,2),
  extraPoints DECIMAL(10,2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (playerId) REFERENCES players(id),
  UNIQUE KEY unique_player_year (playerId, year)
);

-- Create PlayerTournament table
CREATE TABLE player_tournaments (
  id VARCHAR(36) PRIMARY KEY,
  playerId VARCHAR(36) NOT NULL,
  tournamentId VARCHAR(36) NOT NULL,
  placement INT,
  ggPoints INT,
  eloChange INT,
  prizeMoney DECIMAL(10,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (playerId) REFERENCES players(id),
  FOREIGN KEY (tournamentId) REFERENCES tournaments(id),
  UNIQUE KEY unique_player_tournament (playerId, tournamentId)
);

-- Create indexes for performance
CREATE INDEX idx_player_year_stats_year ON player_year_stats(year);
CREATE INDEX idx_player_tournaments_tournament ON player_tournaments(tournamentId);
CREATE INDEX idx_players_region ON players(region);
CREATE INDEX idx_clubs_region ON clubs(region);
CREATE INDEX idx_tournaments_gomafia ON tournaments(gomafiaId);
```
