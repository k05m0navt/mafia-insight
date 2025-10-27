# Scope Update: GoMafia Initial Data Import

**Date**: October 26, 2025  
**Status**: Specification Expanded Based on Detailed Requirements

## Summary

The scope of feature 003-gomafia-data-import has been **significantly expanded** based on detailed analysis of gomafia.pro's data structure and scraping requirements. The feature now includes comprehensive data import from 8 different data sources instead of the initially planned basic player/game import.

---

## What Changed

### Original Scope (October 25, 2025)

- Import basic player data (name, ELO, games)
- Import basic game data (date, winner, duration)
- Import game participations (player-game links with roles)
- Progress tracking and error recovery

### Expanded Scope (October 26, 2025)

All of the above, PLUS:

**New Data Sources (8 total)**:

1. `/rating` - Players list with year/region filters
2. `/stats/{id}` - Player stats by year (dynamic loading)
3. `/stats/{id}?tab=history` - Player tournament history with prizes
4. `/rating?tab=clubs` - Clubs list with year/region filters
5. `/club/{id}` - Club details with president and members
6. `/tournaments` - Tournaments list with time/FSM filters
7. `/tournament/{id}?tab=tournament` - Tournament participants
8. `/tournament/{id}?tab=games` - Tournament games

**New Database Entities**:

- `PlayerYearStats` (new table) - Year-specific statistics per player
- `PlayerTournament` (new table) - Player-tournament participation with prize money
- Extended `Player` model with `region` field
- Extended `Club` model with `gomafiaId`, `region`, `presidentId`, sync fields
- Extended `Tournament` model with `gomafiaId`, `stars`, `averageElo`, `isFsmRated`, sync fields

**New Functional Requirements**: 14 additional requirements (FR-022 through FR-035)

---

## Impact Assessment

### Complexity Increase

- **Data Sources**: 2 → 8 (4x increase)
- **Database Tables**: 6 → 8 (2 new tables)
- **Schema Changes**: 0 → 9 fields + 2 tables
- **Pagination Endpoints**: 2 → 8 (4x increase)
- **Dynamic Content**: 0 → 2 (year selector handling)

### Estimated Timeline Impact

- **Original Estimate**: 4-6 weeks for full feature
- **Revised Estimate**: 6-10 weeks for full feature (due to schema migrations, additional scraping endpoints, and dynamic content handling)

### Implementation Phases Impact

The import phases have been reorganized:

1. **Phase 1**: Clubs (new first priority for foreign key constraints)
2. **Phase 2**: Players (now includes region data)
3. **Phase 3**: Player Year Stats (new phase)
4. **Phase 4**: Tournaments (now includes comprehensive metadata)
5. **Phase 5**: Player Tournament History (new phase)
6. **Phase 6**: Games (expanded to include tournament games)
7. **Phase 7**: Statistics Calculation (unchanged)

---

## Files Updated

### Specification Files

1. **`specs/003-gomafia-data-import/spec.md`**
   - Added Session 2025-10-26 clarifications with 8 data sources
   - Updated Key Entities section with new models and fields
   - Added FR-022 through FR-035 (14 new functional requirements)
   - No changes to User Stories (scope expansion fits within existing stories)

2. **`specs/003-gomafia-data-import/data-model.md`**
   - Complete rewrite to document schema changes
   - Added PlayerYearStats model specification
   - Added PlayerTournament model specification
   - Updated Player, Club, Tournament models
   - Added migration SQL scripts
   - Updated schema diagram
   - Updated import phases (7 phases instead of 3)

### Source Code Files

3. **`prisma/schema.prisma`**
   - Added `region` field to `Player` model
   - Added `gomafiaId`, `region`, `presidentId`, `lastSyncAt`, `syncStatus` to `Club` model
   - Added `gomafiaId`, `stars`, `averageElo`, `isFsmRated`, `lastSyncAt`, `syncStatus` to `Tournament` model
   - Created `PlayerYearStats` model with unique constraint on (playerId, year)
   - Created `PlayerTournament` model with unique constraint on (playerId, tournamentId)
   - Updated relationship definitions for named relations ("ClubMembers", "ClubPresident")

### Documentation Files Created

4. **`specs/003-gomafia-data-import/SCOPE-UPDATE.md`** (this file)
   - Documents the scope expansion
   - Provides impact assessment
   - Lists all changes

---

## Schema Migration Required

**IMPORTANT**: Before implementing this feature, the following migration must be applied:

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

**Prisma Migration Command**:

```bash
npx prisma migrate dev --name add_comprehensive_gomafia_import_schema
```

---

## Key Technical Challenges

### 1. Dynamic Content Loading

- **Challenge**: Year selector on `/stats/{id}` requires waiting for JavaScript to load new data
- **Solution**: Use Playwright's `page.waitForLoadState('networkidle')` after year selection

### 2. Pagination at Scale

- **Challenge**: 8 different endpoints with pagination, potentially thousands of pages
- **Solution**: Implement generic pagination handler with rate limiting (2s between requests)

### 3. Foreign Key Dependencies

- **Challenge**: Clubs reference Players (presidentId), Players reference Clubs (clubId)
- **Solution**: Import Clubs first without presidentId, then update after Players are imported

### 4. Prize Money Parsing

- **Challenge**: Russian currency formatting "60000 ₽" needs conversion
- **Solution**: Regex extraction + Decimal conversion `parseFloat(text.replace(/[^\d.]/g, ''))`

### 5. Region Data Consistency

- **Challenge**: Region names may vary between endpoints (abbreviations, full names)
- **Solution**: Normalize region names to standard format (e.g., "Москва", "Санкт-Петербург")

### 6. Year Stats Historical Data

- **Challenge**: Unknown how many years of historical data exist (2025, 2024, 2023, ...)
- **Solution**: Iterate through years until no data found or reasonable cutoff (e.g., 2020)

---

## Backward Compatibility

### Breaking Changes

- **Database Schema**: Requires migration before deployment
- **Prisma Client**: Must regenerate after schema changes (`npx prisma generate`)
- **Existing Code**: Any code referencing Club or Tournament models may need updates for new fields

### Non-Breaking Changes

- **API Endpoints**: Existing endpoints remain unchanged
- **User Stories**: No changes to user-facing functionality
- **Success Criteria**: All original criteria still valid

---

## Next Steps

### Immediate Actions Required

1. ✅ Update `spec.md` with new data sources and requirements
2. ✅ Update `data-model.md` with schema changes
3. ✅ Update `prisma/schema.prisma` with new fields and models
4. ⏳ Update `plan.md` to reflect expanded scope and phases
5. ⏳ Update `tasks.md` to include new scraping and schema tasks
6. ⏳ Create Prisma migration for schema changes
7. ⏳ Update `contracts/import-api.yaml` if API responses change
8. ⏳ Update `research.md` with dynamic loading and pagination strategies

### Implementation Order

1. **Pre-Implementation**: Run Prisma migration, regenerate client
2. **Phase 1**: Implement Club scraping (simplest, establishes patterns)
3. **Phase 2**: Implement Player scraping with region data
4. **Phase 3**: Implement PlayerYearStats scraping (tests dynamic loading)
5. **Phase 4**: Implement Tournament scraping
6. **Phase 5**: Implement PlayerTournament scraping (tests prize parsing)
7. **Phase 6**: Implement Game scraping (most complex, builds on all previous)
8. **Phase 7**: Calculate statistics

---

## Risk Assessment

### High Risk

- **Schema Migration**: Complex migration with foreign key constraints must be carefully tested
- **Dynamic Content**: Playwright wait strategies must be robust to avoid incomplete data

### Medium Risk

- **Timeline Estimate**: 6-10 weeks is optimistic; actual timeline may extend to 12 weeks
- **Data Volume**: Unknown total data volume may exceed initial estimates (10,000+ players, 100,000+ games)

### Low Risk

- **Rate Limiting**: 2s delay is conservative, unlikely to cause gomafia.pro issues
- **Validation**: Existing 98% validation rate target remains achievable

---

## Constitution Compliance

### Re-Check Against 6 Principles

**1. KISS (Keep It Simple, Stupid)**

- ⚠️ **POTENTIAL VIOLATION**: Scope expansion adds significant complexity
- **Mitigation**: Each data source follows same pattern (fetch → parse → validate → batch import)
- **Verdict**: ✅ PASS (complexity is inherent to requirements, patterns keep it manageable)

**2. YAGNI (You Aren't Gonna Need It)**

- ✅ **PASS**: All new features explicitly requested by user with specific endpoints
- No speculative features added

**3. DRY (Don't Repeat Yourself)**

- ✅ **PASS**: Generic pagination handler will be reused across all 8 endpoints
- Validation schemas reused across models
- Scraping patterns abstracted into common utilities

**4. Separation of Concerns**

- ✅ **PASS**: Each entity has dedicated scraper module
- Database layer separated from scraping logic
- API layer separated from business logic

**5. Single Responsibility**

- ✅ **PASS**: Each scraper handles one data source
- Each model handles one entity type
- Each service has one clear purpose

**6. No Premature Optimization**

- ✅ **PASS**: Batch processing (100 records) is requirement, not optimization
- Rate limiting (2s) is requirement, not optimization
- Indexes added only for foreign keys and frequent queries

**Overall Constitution Verdict**: ✅ **COMPLIANT**

While scope has expanded significantly, the expansion is driven by explicit user requirements, not feature creep. The architecture maintains clean separation and reusable patterns.

---

## Summary for Implementation

**What You Need to Know**:

1. Database schema MUST be migrated before starting implementation
2. Import now covers 8 data sources instead of 2
3. Two new tables: `PlayerYearStats` and `PlayerTournament`
4. Dynamic content loading required for year-specific stats
5. Prize money parsing from Russian currency format required
6. Region data must be extracted and normalized
7. Foreign key dependencies require careful import ordering (Clubs → Players → Tournaments → Games)
8. Timeline increased from 4-6 weeks to 6-10 weeks

**What Hasn't Changed**:

1. User Stories remain the same
2. Success Criteria remain the same
3. Rate limiting (2s between requests) remains the same
4. Batch size (100 records) remains the same
5. Checkpoint strategy remains the same
6. Error recovery mechanisms remain the same

---

## Approval Status

- [x] Specification updated (`spec.md`)
- [x] Data model updated (`data-model.md`)
- [x] Prisma schema updated (`schema.prisma`)
- [ ] Plan updated (`plan.md`) - **PENDING**
- [ ] Tasks updated (`tasks.md`) - **PENDING**
- [ ] Research updated (`research.md`) - **PENDING**
- [ ] Contracts updated (`contracts/import-api.yaml`) - **PENDING**
- [ ] Migration created - **PENDING**

**Next Action**: Update `plan.md` to reflect new phases and timeline.
