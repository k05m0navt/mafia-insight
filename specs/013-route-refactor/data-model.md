# Data Model: Route and Database Refactoring

**Feature**: 013-route-refactor  
**Date**: 2025-01-27  
**Status**: Analysis and Refactoring

## Overview

This feature does not introduce new data models. Instead, it analyzes existing entities (routes, pages, database tables) to identify unused or unnecessary items for removal, and optimizes existing database structures (indexes, RLS policies).

## Analysis Entities

### Route Analysis Entity

**Purpose**: Represents a route in the application that needs analysis

**Attributes**:

- `path`: String (route path, e.g., "/test-players", "/api/test-players")
- `type`: Enum (PAGE_ROUTE, API_ROUTE)
- `usageReferences`: Array of String (locations where route is referenced)
- `navigationReference`: Boolean (referenced in navigation menu)
- `codeReference`: Boolean (imported or used in code)
- `testReference`: Boolean (used in E2E tests)
- `environmentVisibility`: Enum (ALWAYS, DEVELOPMENT_ONLY, PRODUCTION_ONLY)
- `status`: Enum (ACTIVE, INCOMPLETE, UNUSED, GATED)
- `decision`: Enum (KEEP, REMOVE, GATE, COMPLETE)

**Relationships**:

- May reference a Page entity (if PAGE_ROUTE)
- May reference API handler functions
- Referenced by Navigation configuration
- Referenced by E2E tests

### Page Analysis Entity

**Purpose**: Represents a page component that needs analysis

**Attributes**:

- `path`: String (page path, e.g., "/test-players")
- `componentFile`: String (file path to page component)
- `navigationReference`: Boolean (referenced in navigation menu)
- `linkReferences`: Array of String (other pages that link to this page)
- `codeImports`: Array of String (files that import this page)
- `testUsage`: Boolean (used in E2E tests)
- `codeQualityIssues`: Array of Enum (DUPLICATE_CODE, POOR_ERROR_HANDLING, MISSING_ACCESSIBILITY, PERFORMANCE_ISSUES)
- `duplicationPercentage`: Number (percentage of duplicated code)
- `errorHandlingCoverage`: Number (percentage of critical paths with error handling)
- `accessibilityCompliance`: Enum (NON_COMPLIANT, WCAG_A, WCAG_AA, WCAG_AAA)
- `status`: Enum (ANALYZED, NEEDS_REFACTORING, REFACTORED, REMOVED)
- `decision`: Enum (KEEP, REMOVE, GATE, REFACTOR)

**Relationships**:

- Belongs to a Route entity
- May reference other Page entities (through links)
- Referenced by Navigation configuration

### Database Table Analysis Entity

**Purpose**: Represents a database table that needs analysis

**Attributes**:

- `tableName`: String (e.g., "analytics", "player_role_stats")
- `rowCount`: Number (current number of rows)
- `codeReferences`: Array of String (Prisma models, API routes, services that use this table)
- `foreignKeyRelationships`: Array of String (tables that reference this table)
- `plannedFeatureUsage`: Boolean (referenced in planned features)
- `importProcessUsage`: Boolean (used in data import processes)
- `status`: Enum (ACTIVE, EMPTY, UNUSED)
- `decision`: Enum (KEEP, REMOVE, POPULATE)

**Relationships**:

- May have foreign key relationships to other tables
- Referenced by Prisma schema
- Referenced by application code

### Index Analysis Entity

**Purpose**: Represents a database index that needs analysis

**Attributes**:

- `indexName`: String (e.g., "notifications_createdAt_idx")
- `tableName`: String (table the index belongs to)
- `columns`: Array of String (columns indexed)
- `usageStatistics`: Object (query usage data from Supabase)
- `isUsed`: Boolean (whether index is actually used)
- `isForeignKey`: Boolean (whether index is on foreign key column)
- `status`: Enum (ACTIVE, UNUSED, MISSING)
- `decision`: Enum (KEEP, REMOVE, ADD)

**Relationships**:

- Belongs to a Database Table
- May be identified by Supabase performance advisors

## Existing Database Schema

The following tables from the Prisma schema are subject to analysis:

### Tables with Zero Rows (Subject to Analysis)

- `analytics` - 0 rows
- `player_role_stats` - 0 rows
- `regions` - 0 rows

### Tables Requiring Index Optimization

- `clubs` - Missing indexes on `createdBy`, `presidentId` foreign keys
- `players` - Missing indexes on `userId`, `clubId` foreign keys
- `games` - Missing index on `tournamentId` foreign key
- `tournaments` - Missing index on `createdBy` foreign key
- `player_tournaments` - Missing index on `tournamentId` foreign key
- `game_participations` - Missing index on `gameId` foreign key

### Tables with Unused Indexes

- `notifications` - Unused index: `notifications_createdAt_idx`
- `email_logs` - Unused indexes: `email_logs_status_createdAt_idx`, `email_logs_type_idx`
- `data_integrity_reports` - Unused indexes: `data_integrity_reports_timestamp_idx`, `data_integrity_reports_status_idx`

### Tables Requiring RLS Optimization

- `users` - RLS policies need optimization (use `(select auth.<function>())` pattern)

## Validation Rules

### Route Analysis

- Route path must be valid Next.js route format
- Usage references must be verified before removal decision
- Environment visibility must be checked before gating decision

### Page Analysis

- Component file must exist in codebase
- Code quality metrics must be measurable (duplication percentage, error handling coverage)
- Accessibility compliance must be verifiable (WCAG 2.1 Level AA)

### Database Table Analysis

- Code references must be verified (search Prisma schema, codebase imports)
- Foreign key relationships must be handled before removal
- Planned feature usage must be checked against feature specifications

### Index Analysis

- Usage statistics must be verified via Supabase advisors
- Foreign key indexes must be added using CONCURRENT creation
- Unused indexes must be confirmed unused before removal

## State Transitions

### Route Status Flow

```
UNKNOWN → ANALYZED → [ACTIVE | INCOMPLETE | UNUSED] → [KEEP | REMOVE | GATE | COMPLETE]
```

### Page Status Flow

```
UNKNOWN → ANALYZED → [NEEDS_REFACTORING | ACTIVE] → [REFACTORED | KEEP | REMOVE | GATE]
```

### Table Status Flow

```
UNKNOWN → ANALYZED → [ACTIVE | EMPTY | UNUSED] → [KEEP | REMOVE | POPULATE]
```

### Index Status Flow

```
UNKNOWN → ANALYZED → [ACTIVE | UNUSED | MISSING] → [KEEP | REMOVE | ADD]
```

## Migration Strategy

### Zero-Downtime Index Creation

1. Create index with CONCURRENT keyword
2. Verify index creation success
3. Monitor query performance
4. Rollback if performance degrades

### Table Removal Strategy

1. Remove foreign key constraints (if any)
2. Verify no code references exist
3. Create migration to drop table
4. Remove Prisma model
5. Update all code references
6. Verify E2E tests pass

### Index Removal Strategy

1. Verify index is truly unused (via Supabase advisors)
2. Create migration to drop index
3. Monitor query performance after removal
4. Rollback if performance issues detected

## Data Integrity

### Foreign Key Constraints

- Must be removed before table deletion
- Must be verified before index removal
- Must not break referential integrity

### Code References

- All Prisma model references must be removed
- All API route references must be removed
- All service/utility references must be removed
- Navigation references must be updated

### Test References

- E2E test references must be updated
- Test data sources must be migrated
- Test route usage must be replaced with alternative data sources
