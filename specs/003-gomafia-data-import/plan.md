# Implementation Plan: GoMafia Initial Data Import

**Branch**: `003-gomafia-data-import` | **Date**: October 26, 2025 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-gomafia-data-import/spec.md`

**Note**: This plan has been updated to reflect the expanded scope including comprehensive data import from 8 gomafia.pro endpoints with new database schema requirements.

## Summary

**Primary Requirement**: Populate empty database with comprehensive historical data from gomafia.pro on first user visit, including players, clubs, tournaments, games, year-specific statistics, and tournament participation with prize money.

**Technical Approach**: Leverage Playwright for browser automation to scrape 8 paginated endpoints from gomafia.pro, implementing PostgreSQL advisory locks for concurrency control, batch processing with checkpoints for resilience, and dynamic content handling for year-specific statistics. Auto-trigger import on first API call requiring data with 12-hour maximum duration timeout.

## Technical Context

**Language/Version**: TypeScript 5.0+ (Next.js 16.0 App Router)  
**Primary Dependencies**: Next.js, Prisma ORM, Playwright (browser automation), Zod (validation), React Query (data fetching), shadcn UI (components)  
**Storage**: PostgreSQL via Supabase (Prisma ORM for schema management, advisory locks for concurrency)  
**Testing**: Vitest (unit), Playwright Test (E2E), React Testing Library (components), Prisma test database  
**Target Platform**: Next.js server (API routes) + React client (browser)  
**Project Type**: Full-stack web application (Next.js App Router with server and client components)  
**Performance Goals**:

- Initial import completion: 3-4 hours (estimated for 1000 players, 5000 games), maximum 12 hours before timeout
- Progress updates: Every 2 seconds for UI responsiveness
- Resume capability: Within 10 seconds of retry initiation
- Rate limiting: 2 seconds between requests (30 requests/minute) to respect gomafia.pro

**Constraints**:

- Rate limit: Minimum 2 seconds between requests (maximum 30 requests/minute)
- Batch size: 100 records per batch for memory optimization
- Retry limit: 3 retries with exponential backoff for transient failures
- Maximum import duration: 12 hours (automatic timeout)
- No duplicate records: Skip existing records based on gomafiaId
- Advisory lock timeout: Release on failure to prevent deadlock

**Scale/Scope**:

- Players: 1,000-10,000 with year-specific statistics (2020-2025)
- Clubs: 100-1,000 with president and members
- Tournaments: 500-5,000 with participants and games
- Games: 5,000-50,000 with participations
- Player-Tournament relationships: 10,000-100,000 with prize money
- Year stats records: 5,000-50,000 (players × years)
- Database storage: 500MB-5GB estimated
- Pagination depth: Up to 100+ pages per endpoint

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Clean Architecture (NON-NEGOTIABLE)

✅ **PASS**: Business logic (import orchestration, validation) separated from infrastructure (Playwright scraping, Prisma database). Use cases organized by entity type (players, clubs, tournaments, games). Dependency inversion maintained: core logic doesn't depend on scraping implementation or database specifics.

### II. Test-Driven Development (NON-NEGOTIABLE)

✅ **PASS**: TDD mandatory per spec principle. All scraping functions, validation logic, checkpoint management, and advisory lock handling will have tests written first. Test coverage target: >80%.

### III. Spec-Driven Development

✅ **PASS**: Comprehensive 36-requirement specification completed with 4 independent user stories, 9 edge cases, and 5 clarifications. Each story testable independently. Implementation follows directly from spec.

### IV. Modern Frontend Best Practices

✅ **PASS**: shadcn UI components for progress display, React Query for real-time status polling, accessible UI with loading states, error handling, and progress indicators. WCAG 2.1 AA compliance planned.

### V. Package Management & Documentation

✅ **PASS**: Yarn will be used exclusively (per user preference). Context7 MCP available for accessing Next.js, Prisma, Playwright documentation. All dependencies documented in package.json with rationale.

### VI. Code Quality & Standards

✅ **PASS**: ESLint configuration exists. Code reviews will verify architecture compliance, test coverage, and performance benchmarks. Complexity justified by requirement for 8-endpoint scraping with dynamic content handling.

**Constitution Verdict**: ✅ **ALL GATES PASS** - No violations. Feature architecture complies with all constitution principles.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-gomafia-data-import/
├── spec.md              # ✅ Feature specification (complete with 5 clarifications)
├── plan.md              # ✅ This file (implementation plan - in progress)
├── research.md          # ⏳ Phase 0 output (to be generated)
├── data-model.md        # ✅ Phase 1 output (already complete - schema changes documented)
├── quickstart.md        # ⏳ Phase 1 output (to be generated)
├── contracts/           # ⏳ Phase 1 output (to be generated)
│   └── import-api.yaml  # OpenAPI spec for import endpoints
├── checklists/
│   └── requirements.md  # ✅ Spec quality checklist (complete)
└── tasks.md             # ⏳ Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Next.js full-stack web application structure

src/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── gomafia-sync/
│   │       ├── import/
│   │       │   ├── route.ts      # [NEW] POST /api/gomafia-sync/import (trigger)
│   │       │   └── cancel/
│   │       │       └── route.ts  # [NEW] DELETE /api/gomafia-sync/import (cancel)
│   │       ├── check-empty/
│   │       │   └── route.ts      # [NEW] GET /api/gomafia-sync/check-empty
│   │       └── sync/
│   │           └── status/
│   │               └── route.ts  # [EXISTING] GET /api/gomafia-sync/sync/status
│   │
│   └── sync/                      # Sync management UI pages
│       └── page.tsx               # [EXTEND] Add import controls
│
├── components/
│   └── sync/
│       ├── ImportProgressCard.tsx    # [NEW] Progress display component
│       ├── ImportControls.tsx        # [NEW] Manual trigger/cancel controls
│       └── ImportSummary.tsx         # [NEW] Post-import summary display
│
├── lib/
│   ├── gomafia/
│   │   ├── scrapers/                 # [NEW] Scraping logic per entity
│   │   │   ├── players-scraper.ts    # Scrape /rating (players list)
│   │   │   ├── player-stats-scraper.ts # Scrape /stats/{id} (year stats)
│   │   │   ├── player-history-scraper.ts # Scrape /stats/{id}?tab=history
│   │   │   ├── clubs-scraper.ts      # Scrape /rating?tab=clubs
│   │   │   ├── club-details-scraper.ts # Scrape /club/{id}
│   │   │   ├── tournaments-scraper.ts # Scrape /tournaments
│   │   │   ├── tournament-participants-scraper.ts # Scrape /tournament/{id}?tab=tournament
│   │   │   └── tournament-games-scraper.ts # Scrape /tournament/{id}?tab=games
│   │   │
│   │   ├── parsers/                  # [NEW] HTML parsing utilities
│   │   │   ├── player-parser.ts
│   │   │   ├── club-parser.ts
│   │   │   ├── tournament-parser.ts
│   │   │   └── game-parser.ts
│   │   │
│   │   ├── validators/               # [NEW] Zod schemas for validation
│   │   │   ├── player-schema.ts
│   │   │   ├── club-schema.ts
│   │   │   ├── tournament-schema.ts
│   │   │   └── game-schema.ts
│   │   │
│   │   └── import/                   # [NEW] Import orchestration
│   │       ├── import-orchestrator.ts # Main import coordinator
│   │       ├── checkpoint-manager.ts  # Checkpoint persistence
│   │       ├── rate-limiter.ts        # 2-second delay enforcement
│   │       ├── advisory-lock.ts       # PostgreSQL advisory lock wrapper
│   │       ├── batch-processor.ts     # 100-record batch processing
│   │       └── import-phases.ts       # 7 import phases coordination
│   │
│   ├── db/
│   │   └── migrations/               # [NEW] Prisma migrations
│   │       └── YYYYMMDDHHMMSS_add_comprehensive_gomafia_import_schema/
│   │           └── migration.sql     # Schema changes for expanded import
│   │
│   └── hooks/
│       ├── useImportStatus.ts        # [NEW] React Query hook for status polling
│       └── useImportTrigger.ts       # [NEW] Hook for triggering import
│
├── services/
│   ├── import-service.ts             # [NEW] Import business logic service
│   └── validation-service.ts         # [NEW] Data validation service
│
└── types/
    ├── gomafia-import.ts             # [NEW] Import-specific types
    └── gomafia-entities.ts           # [EXTEND] Add new entity types

prisma/
├── schema.prisma                     # [MODIFIED] Add new fields/models (already updated)
└── migrations/
    └── YYYYMMDDHHMMSS_add_comprehensive_gomafia_import_schema/
        └── migration.sql             # [NEW] Schema migration

tests/
├── unit/
│   ├── scrapers/                     # [NEW] Scraper unit tests
│   ├── parsers/                      # [NEW] Parser unit tests
│   ├── validators/                   # [NEW] Validator unit tests
│   ├── checkpoint-manager.test.ts    # [NEW] Checkpoint logic tests
│   ├── rate-limiter.test.ts          # [NEW] Rate limiter tests
│   └── advisory-lock.test.ts         # [NEW] Advisory lock tests
│
├── integration/
│   ├── import-orchestrator.test.ts   # [NEW] Full import flow tests
│   ├── batch-processor.test.ts       # [NEW] Batch processing tests
│   └── api-import-endpoints.test.ts  # [NEW] API endpoint tests
│
└── e2e/
    ├── import-flow.spec.ts           # [NEW] E2E import trigger and progress
    └── import-resume.spec.ts         # [NEW] E2E import resume after failure
```

**Structure Decision**: Using existing Next.js App Router structure with server-side API routes for import orchestration. New `/lib/gomafia/` module encapsulates all scraping, parsing, and import logic following Clean Architecture. Components in `/components/sync/` for UI. Tests organized by type (unit/integration/e2e) with comprehensive coverage for all new scraping and import functionality.

**Key Additions**:

- 8 specialized scrapers (one per gomafia.pro endpoint)
- Separate parser modules for each entity type
- Zod validators for all imported data
- Import orchestrator with 7-phase coordination
- Checkpoint manager for resume capability
- Advisory lock wrapper for PostgreSQL concurrency control
- React Query hooks for real-time progress updates

---

## Complexity Tracking

> **No Constitution violations - this section not applicable**

All constitution principles are satisfied. The expanded scope (8 endpoints, new schema, dynamic content handling) adds implementation complexity but does not violate architectural principles. Complexity is inherent to comprehensive data import requirements and is managed through:

- Clear separation of concerns (scrapers, parsers, validators, orchestrator)
- Batch processing to manage memory
- Checkpoint strategy for resilience
- Advisory locks for concurrency safety

---

## Phase Completion Summary

### Phase 0: Research (to be completed)

**Status**: ⏳ Pending

**Deliverables**:

- `research.md` documenting technical decisions for:
  - Advisory lock implementation with PostgreSQL
  - Dynamic content handling strategy for year selectors
  - Pagination pattern across 8 endpoints
  - Prize money parsing from Russian currency format
  - Region name normalization strategy
  - Year iteration stopping criteria (2 consecutive empty years)
  - Checkpoint serialization format
  - Best practices for Playwright stability

### Phase 1: Design & Contracts (partially complete)

**Status**: 🟡 Partially Complete

**Completed**:

- ✅ `data-model.md` - Comprehensive data model with schema changes documented
- ✅ `prisma/schema.prisma` - Schema updated with new fields and models

**Remaining**:

- ⏳ `contracts/import-api.yaml` - OpenAPI specification for import endpoints
- ⏳ `quickstart.md` - TDD implementation guide for import feature
- ⏳ Agent context update via `.specify/scripts/bash/update-agent-context.sh`

**Design Highlights (from data-model.md)**:

- 2 new models: `PlayerYearStats`, `PlayerTournament`
- Extended models: `Player` (+region), `Club` (+gomafiaId, +region, +presidentId, +sync fields), `Tournament` (+gomafiaId, +stars, +averageElo, +isFsmRated, +sync fields)
- 7 import phases: Clubs → Players → Player Year Stats → Tournaments → Player Tournament History → Games → Statistics Calculation
- Batch-level checkpointing with JSON serialization in SyncStatus.currentOperation

---

## Constitution Re-Check (Post-Design)

_Performed after Phase 1 design completion_

### I. Clean Architecture

✅ **STILL COMPLIANT**: Design maintains separation - scrapers (infrastructure) → import service (use case) → domain models. No coupling between scraping logic and business logic.

### II. Test-Driven Development

✅ **STILL COMPLIANT**: Test structure defined in project layout. TDD workflow documented in upcoming quickstart.md.

### III. Spec-Driven Development

✅ **STILL COMPLIANT**: All design decisions trace back to spec requirements (FR-001 through FR-035).

### IV. Modern Frontend Best Practices

✅ **STILL COMPLIANT**: React Query polling pattern for progress, shadcn components for UI, accessible loading states.

### V. Package Management & Documentation

✅ **STILL COMPLIANT**: Yarn usage confirmed, dependencies to be documented in package.json.

### VI. Code Quality & Standards

✅ **STILL COMPLIANT**: Linting enforced, test coverage targets set, complexity managed through modular design.

**Post-Design Verdict**: ✅ **CONTINUED COMPLIANCE** - No architecture drift during design phase.

---

## Next Steps

1. **Complete Phase 0**: Generate `research.md` to resolve implementation unknowns
2. **Complete Phase 1**: Generate `contracts/import-api.yaml` and `quickstart.md`
3. **Update Agent Context**: Run update script to inform AI assistants of new technologies
4. **Phase 2**: Run `/speckit.tasks` to generate detailed task breakdown

**Blockers**: None - all prerequisites satisfied, schema changes documented, clarifications complete.
