# Implementation Plan: Replace Mock Scrapers with Real Scrapers

**Branch**: `012-real-scrapers` | **Date**: January 27, 2025 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/012-real-scrapers/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

**Primary Requirement**: Replace mock data generation in admin import workflow with real Playwright-based scrapers from gomafia.pro. Each admin strategy button should run its corresponding Phase class with actual data scraping.

**Technical Approach**: Refactor `/api/admin/import/start` endpoint to use existing Phase classes (PlayersPhase, ClubsPhase, etc.) with ImportOrchestrator infrastructure instead of generateSampleData. Each admin strategy button triggers its specific phase execution with real scrapers, rate limiting, checkpoint management, and progress tracking.

## Technical Context

**Language/Version**: TypeScript 5.0+ (Next.js 16.0 App Router)  
**Primary Dependencies**: Next.js 16.0, Prisma ORM 5.0, Playwright 1.56 (browser automation), Zod 4.1 (validation), React Query (data fetching), shadcn UI (components)  
**Storage**: PostgreSQL via Supabase (Prisma ORM for schema management)  
**Testing**: Vitest 1.0 (unit, integration), Playwright Test (E2E), React Testing Library (components)  
**Target Platform**: Next.js server (API routes) + React client (admin dashboard)  
**Project Type**: Full-stack web application (Next.js App Router with server and client components)  
**Performance Goals**:

- Individual phase imports complete in ≤5 minutes for typical dataset sizes (100 players, 50 clubs, etc.)
- Real-time progress updates every 2-5 seconds during admin imports
- Rate limiting: 2 seconds between requests to respect gomafia.pro

**Constraints**:

- Rate limit: Minimum 2 seconds between requests to gomafia.pro
- Batch size: 100 records per batch for memory optimization
- Retry limit: 3 retries with exponential backoff for transient failures
- No duplicate records: Skip existing records based on gomafiaId
- Advisory lock: Prevent concurrent imports
- Validation rate: ≥95% valid records / total scraped

**Scale/Scope**:

- Admin-initiated imports: Individual phase execution (Players, Clubs, Tournaments, Games, Player Stats, Tournament Results)
- Data validation: ≥95% validation rate per import
- Progress tracking: Real-time updates with phase names and record counts
- Checkpoint system: Resume failed imports with ≤5% duplicate records

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Clean Architecture (NON-NEGOTIABLE)

✅ **PASS**: Feature refactors existing infrastructure (Phase classes, ImportOrchestrator, scrapers) without adding new layers. Existing architecture already separates business logic (import orchestration) from infrastructure (Playwright scraping, Prisma database). No architectural violations.

### II. Test-Driven Development (NON-NEGOTIABLE)

✅ **PASS**: Tests already exist for real scrapers and ImportOrchestrator from feature 003. Will add tests for admin endpoint refactoring and strategy-to-phase integration. Test coverage target: >80%.

### III. Spec-Driven Development

✅ **PASS**: Comprehensive 9-requirement specification completed with 1 user story, 5 edge cases, and 1 clarification. Independent test defined. Implementation follows directly from spec.

### IV. Modern Frontend Best Practices

✅ **PASS**: Existing admin dashboard uses shadcn UI components. Real-time progress updates already implemented. No frontend changes required.

### V. Package Management & Documentation

✅ **PASS**: Yarn will be used exclusively (per constitution). All dependencies already installed. Documentation updates will be minimal as this is a refactoring of existing features.

### VI. Code Quality & Standards

✅ **PASS**: ESLint configuration exists. Code reviews will verify architecture compliance, test coverage. Refactoring removes complexity (mock data generation) rather than adding it.

**Constitution Verdict**: ✅ **ALL GATES PASS** - No violations. Feature complies with all constitution principles.

---

## Project Structure

### Documentation (this feature)

```text
specs/012-real-scrapers/
├── spec.md              # ✅ Feature specification (complete with 1 clarification)
├── plan.md              # ✅ This file (implementation plan)
├── research.md          # ✅ Phase 0 output (complete)
├── data-model.md        # ✅ Phase 1 output (complete)
├── quickstart.md        # ✅ Phase 1 output (complete)
├── contracts/           # ✅ Phase 1 output (complete)
│   └── admin-import-api.yaml
└── tasks.md             # ⏳ Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Next.js full-stack web application structure

src/
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── import/
│   │           ├── start/
│   │           │   └── route.ts      # [REFACTOR] Replace mock data with Phase execution
│   │           ├── stop/
│   │           │   └── route.ts      # [EXISTING] Unchanged
│   │           └── progress/
│   │               └── route.ts      # [EXISTING] Unchanged
│   │
│   └── admin/
│       └── import/
│           └── page.tsx              # [EXISTING] No changes needed
│
├── components/
│   └── sync/
│       ├── ImportProgressCard.tsx    # [EXISTING] Unchanged
│       ├── ImportControls.tsx        # [EXISTING] Unchanged
│       └── ErrorMessagePanel.tsx     # [EXISTING] Unchanged
│
├── lib/
│   └── gomafia/
│       ├── import/
│       │   ├── orchestrator.ts       # [EXISTING] Unchanged (progress tracking)
│       │   ├── import-orchestrator.ts # [EXISTING] Unchanged (7-phase workflow)
│       │   ├── strategy.ts           # [MAY REFACTOR] Consider integrating with Phase classes
│       │   ├── phases/
│       │   │   ├── clubs-phase.ts           # [EXISTING] Unchanged
│       │   │   ├── players-phase.ts         # [EXISTING] Unchanged
│       │   │   ├── tournaments-phase.ts     # [EXISTING] Unchanged
│       │   │   ├── games-phase.ts           # [EXISTING] Unchanged
│       │   │   ├── player-year-stats-phase.ts # [EXISTING] Unchanged
│       │   │   ├── player-tournament-phase.ts # [EXISTING] Unchanged
│       │   │   └── statistics-phase.ts       # [EXISTING] Unchanged
│       │   ├── advisory-lock.ts      # [EXISTING] Unchanged
│       │   ├── checkpoint-manager.ts # [EXISTING] Unchanged
│       │   ├── rate-limiter.ts       # [EXISTING] Unchanged
│       │   ├── batch-processor.ts    # [EXISTING] Unchanged
│       │   └── timeout-manager.ts    # [EXISTING] Unchanged
│       │
│       ├── scrapers/                 # [EXISTING] All scrapers unchanged
│       │   ├── players-scraper.ts
│       │   ├── clubs-scraper.ts
│       │   ├── tournaments-scraper.ts
│       │   ├── tournament-games-scraper.ts
│       │   ├── player-stats-scraper.ts
│       │   ├── player-tournament-history-scraper.ts
│       │   └── pagination-handler.ts
│       │
│       ├── validators/               # [EXISTING] All validators unchanged
│       │   ├── player-schema.ts
│       │   ├── club-schema.ts
│       │   ├── tournament-schema.ts
│       │   └── game-schema.ts
│       │
│       └── parsers/                  # [EXISTING] All parsers unchanged
│           ├── currency-parser.ts
│           ├── date-parser.ts
│           └── region-normalizer.ts

tests/
├── unit/
│   └── api/
│       └── admin/
│           └── import-start.test.ts  # [NEW] Test admin import endpoint
│
├── integration/
│   ├── admin-import.test.ts          # [NEW] Integration test for admin imports
│   └── strategy-phase-integration.test.ts # [NEW] Strategy to phase mapping
│
└── e2e/
    └── admin-import.spec.ts          # [EXISTING] Update to verify real data
```

**Structure Decision**: This feature primarily refactors existing code to replace mock data generation with real Phase execution. The codebase structure remains unchanged as a Next.js full-stack web application with existing Phase classes, scrapers, and admin dashboard already in place.

## Complexity Tracking

> **No complexity violations**
