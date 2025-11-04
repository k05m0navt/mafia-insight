# Table Cleanup Decision Checklist

**Date**: 2025-01-27  
**Feature**: 013-route-refactor  
**User Story**: US2 - Clean Up Unused Database Tables

## Decision Criteria

For each table with zero rows, evaluate:

1. **Code References**: Is the table/model used in application code?
2. **Planned Features**: Is the table referenced in planned features (specs/)?
3. **Foreign Key Relationships**: Are there foreign keys referencing this table?
4. **Import Process Usage**: Is the table used in data import processes?

## Decision Matrix

| Table             | Row Count | Code References                                                                    | Planned Features                      | Foreign Keys                       | Import Usage                 | Decision            | Rationale                                                                                                         |
| ----------------- | --------- | ---------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------- | ---------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| analytics         | 0         | ✅ Yes (errorTracking.ts, monitoring.ts, subscriptions/index.ts, realtime/sync.ts) | ✅ Yes (spec 001-mafia-analytics)     | ❌ No                              | ❌ No                        | **KEEP & POPULATE** | Active code references, planned feature. Needs population logic implementation.                                   |
| player_role_stats | 0         | ✅ Yes (statistics-phase.ts, gameService.ts, analyticsService.ts)                  | ✅ Yes (spec 001-mafia-analytics)     | ✅ Yes (Player.roleStats relation) | ✅ Yes (StatisticsPhase)     | **KEEP & POPULATE** | Actively used in import process (StatisticsPhase), referenced by Player model. Should be populated during import. |
| regions           | 0         | ✅ Yes (regions.ts, API routes, validations, scrapers)                             | ✅ Yes (spec 003-gomafia-data-import) | ❌ No                              | ✅ Yes (should be populated) | **KEEP & POPULATE** | Active API routes exist, defaultRegions data available in code. Should be seeded with default regions.            |

## Detailed Analysis

### Analytics Table

**Code References**:

- `src/lib/errorTracking.ts` - References Analytics model
- `src/lib/monitoring.ts` - References Analytics model
- `src/lib/subscriptions/index.ts` - References Analytics model
- `src/lib/realtime/sync.ts` - Has `updateAnalytics()` method (line 248)

**Planned Features**:

- Spec 001-mafia-analytics defines Analytics entity as part of analytics system

**Foreign Key Relationships**:

- None - This is a standalone analytics cache table

**Import Process Usage**:

- Not directly used in import, but should be populated by analytics calculation processes

**Decision**: **KEEP & POPULATE**

- Table is part of planned analytics feature
- Code references exist but population logic may not be fully implemented
- Should implement population logic in analytics calculation services

### PlayerRoleStats Table

**Code References**:

- `src/lib/gomafia/import/phases/statistics-phase.ts` - Actively populates PlayerRoleStats (lines 87-114)
- `src/services/gameService.ts` - Updates PlayerRoleStats in `updatePlayerStats()` method (lines 244-266)
- `src/services/analyticsService.ts` - Reads PlayerRoleStats in `getPlayerAnalytics()` (line 13)
- Prisma schema: Player model has `roleStats PlayerRoleStats[]` relation

**Planned Features**:

- Spec 001-mafia-analytics defines PlayerRoleStats as part of analytics system

**Foreign Key Relationships**:

- ✅ Foreign key: `playerId` references `players.id`
- ✅ Reverse relation: `Player.roleStats` relation exists

**Import Process Usage**:

- ✅ StatisticsPhase import process should populate this table
- Integration test exists: `tests/integration/import-phases/statistics-phase.test.ts`

**Decision**: **KEEP & POPULATE**

- Table is actively used in code and import processes
- Should be populated by StatisticsPhase during data import
- Issue: StatisticsPhase may not be running or completing successfully

**Action Required**: Verify StatisticsPhase is executing and populating data correctly

### Regions Table

**Code References**:

- `src/app/api/regions/route.ts` - GET endpoint for regions (lines 14-119)
- `src/app/api/regions/[regionCode]/route.ts` - PATCH/DELETE endpoints
- `src/lib/regions.ts` - Region utilities and defaultRegions data (lines 17-98)
- `src/lib/gomafia/scrapers/players-scraper.ts` - Uses region data
- `src/lib/validations.ts` - References Region model
- `src/app/api/search/players/route.ts` - Uses regions for filtering

**Planned Features**:

- Spec 003-gomafia-data-import mentions region data in Player model

**Foreign Key Relationships**:

- None - This is a standalone reference data table

**Import Process Usage**:

- Should be seeded with default regions data
- `src/lib/regions.ts` contains `defaultRegions` array with 9 regions

**Decision**: **KEEP & POPULATE**

- Active API routes exist and are used
- Default regions data available in code but not in database
- Should be seeded during database initialization

**Action Required**: Create seed script to populate regions table with defaultRegions data

## Summary

**All three tables should be KEPT and POPULATED, not removed.**

None of these tables are truly unused - they all have:

- Active code references
- Planned feature usage
- Clear population paths

The issue is that population logic needs to be implemented or verified:

1. **analytics**: Implement analytics calculation and caching logic
2. **player_role_stats**: Verify StatisticsPhase is running and populating correctly
3. **regions**: Seed with defaultRegions data during database initialization

## Next Steps

1. Verify StatisticsPhase execution and fix if needed (player_role_stats)
2. Create seed script for regions table (regions)
3. Implement analytics population logic (analytics)
4. Update tasks.md to reflect KEEP decisions instead of REMOVE
