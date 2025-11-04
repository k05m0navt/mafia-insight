# Data Model: Replace Mock Scrapers with Real Scrapers

**Date**: January 27, 2025  
**Feature**: Replace Mock Scrapers with Real Scrapers  
**Status**: Ready for Implementation

## Overview

This feature refactors existing data flow by replacing mock data generation with real Playwright-based scraping. No database schema changes are required. The data model remains unchanged from existing features.

## Existing Entities

All entities are already defined in the Prisma schema (`prisma/schema.prisma`) and database migrations:

### Core Entities (Unchanged)

**Player**

- Fields: id, gomafiaId, name, region, clubId, eloRating, totalGames, wins, losses, etc.
- Validation: Zod schema in `src/lib/gomafia/validators/player-schema.ts`
- Source: `gomafia.pro/rating` via `PlayersScraper`

**Club**

- Fields: id, gomafiaId, name, region, presidentId, memberCount, etc.
- Validation: Zod schema in `src/lib/gomafia/validators/club-schema.ts`
- Source: `gomafia.pro/rating?tab=clubs` via `ClubsScraper`

**Tournament**

- Fields: id, gomafiaId, name, startDate, prizePool, maxParticipants, etc.
- Validation: Zod schema in `src/lib/gomafia/validators/tournament-schema.ts`
- Source: `gomafia.pro/tournaments` via `TournamentsScraper`

**Game**

- Fields: id, gomafiaId, tournamentId, date, durationMinutes, winnerTeam, etc.
- Validation: Zod schema in `src/lib/gomafia/validators/game-schema.ts`
- Source: `gomafia.pro/tournament/{id}?tab=games` via `TournamentGamesScraper`

**PlayerYearStats**

- Fields: playerId, year, totalGames, donGames, mafiaGames, sheriffGames, civilianGames, eloRating, extraPoints
- Validation: Zod schema in `src/lib/gomafia/validators/player-schema.ts`
- Source: `gomafia.pro/stats/{id}` via `PlayerStatsScraper`

**PlayerTournament**

- Fields: playerId, tournamentId, position, prizeMoney, gamesPlayed
- Validation: Prisma schema
- Source: `gomafia.pro/stats/{id}?tab=history` via `PlayerTournamentHistoryScraper`

### Import Tracking Entities (Unchanged)

**ImportProgress**

- Fields: id, operation, progress, totalRecords, processedRecords, errors, startTime, estimatedCompletion, status
- Purpose: Track admin-initiated imports
- Query endpoint: `/api/import/progress`

**SyncLog**

- Fields: id, type, status, startTime, endTime, recordsProcessed, errors
- Purpose: Track historical import operations
- Used by: Both `/api/admin/import/start` and `/api/gomafia-sync/import`

**SyncStatus**

- Fields: id, isRunning, progress, currentOperation, lastSyncTime, lastSyncType, lastError
- Purpose: Current system-wide sync state
- Singleton: Only one record with id='current'

**ImportCheckpoint**

- Fields: currentPhase, currentBatch, lastProcessedId, processedIds, progress
- Purpose: Resume failed imports
- Storage: In-memory with database persistence capability

## Data Flow Changes

### Before (Mock Data Flow)

```
Admin clicks "Start Import" for Players
  ↓
POST /api/admin/import/start { strategy: 'players' }
  ↓
generateSampleData('players') → [SamplePlayer, SamplePlayer, ...]
  ↓
DataImportStrategy.executeImport('players', sampleData)
  ↓
processBatch('players', batch) → importPlayers(batch) → Prisma createMany
  ↓
ImportOrchestrator.updateProgress(importId, processedRecords)
  ↓
Admin dashboard shows progress
```

### After (Real Scraper Flow)

```
Admin clicks "Start Import" for Players
  ↓
POST /api/admin/import/start { strategy: 'players' }
  ↓
ImportOrchestrator (singleton).startImport('players', estimate)
  ↓
Launch browser → ImportOrchestrator (7-phase).new(browser)
  ↓
PlayersPhase(orchestrator).execute()
  ↓
PlayersScraper.scrapeAllPlayers() → scrape from gomafia.pro
  ↓
Validate with playerSchema → filter duplicates → batch insert
  ↓
ImportOrchestrator.updateProgress() + Metrics tracking
  ↓
Admin dashboard shows real-time progress with validation metrics
```

## Validation Rules

All validation rules remain unchanged from existing Zod schemas:

**Players**

- gomafiaId: Required string, unique
- name: Required string, non-empty
- eloRating: Number, non-negative
- region: Valid region code

**Clubs**

- gomafiaId: Required string, unique
- name: Required string, non-empty
- region: Valid region code

**Tournaments**

- gomafiaId: Required string, unique
- name: Required string, non-empty
- startDate: Valid date
- prizePool: Number, non-negative

**Games**

- gomafiaId: Required string, unique
- tournamentId: Required, references Tournament
- date: Valid date
- winnerTeam: One of BLACK, RED, DRAW

## Duplicate Handling

**Strategy**: Skip duplicates based on `gomafiaId` field using Prisma's `skipDuplicates: true`.

**Implementation**: All Phase.execute() methods use `createMany` with `skipDuplicates: true` option.

**Alternative Considered**: Custom duplicate detection before insert

- **Rejected**: Prisma's built-in handling is sufficient and more efficient

## Migration Requirements

**Database Schema**: No changes required. All tables exist.

**Data Migration**: No data migration needed. Existing data remains valid.

**Breaking Changes**: None. This is a pure refactoring of import logic.

## Relationships (Unchanged)

All relationships remain unchanged:

- Player → Club (many-to-one via clubId)
- Player → PlayerYearStats (one-to-many)
- Player → PlayerTournament (one-to-many)
- Tournament → Game (one-to-many)
- Game → GameParticipation (one-to-many, not used in admin imports)

## Query Patterns

**Admin Import Status**

```typescript
// Get all imports
GET /api/import/progress
// Response: { imports: ImportProgress[], progress?: ImportProgress }

// Get specific import
GET /api/import/progress?importId=xxx
// Response: { progress: ImportProgress }
```

**Import Metrics**

```typescript
// Built into ImportOrchestrator
orchestrator.getValidationMetrics();
// Returns: { totalFetched, validRecords, invalidRecords, duplicatesSkipped, validationRate }
```

## Performance Considerations

**Batch Size**: 100 records per batch (unchanged)
**Rate Limiting**: 2 seconds between requests to gomafia.pro (unchanged)
**Memory**: Playwright browser instances are released after each import
**Database**: Indexes on gomafiaId fields ensure fast duplicate checks
