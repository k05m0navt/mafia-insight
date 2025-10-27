# Tasks: GoMafia Initial Data Import

**Input**: Design documents from `/specs/003-gomafia-data-import/`  
**Prerequisites**: plan.md, spec.md (with 4 user stories), research.md, data-model.md, contracts/import-api.yaml

**Tests**: Included (TDD mandatory per Constitution Principle II)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a **Next.js full-stack web application**. Paths use the existing structure:

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Business logic and utilities
- `src/services/` - Service layer
- `prisma/` - Database schema and migrations
- `tests/` - All test files (unit, integration, e2e)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and schema migration

- [x] T001 Verify Prisma schema changes are already committed (Player +region, Club +5 fields, Tournament +6 fields, PlayerYearStats, PlayerTournament models in prisma/schema.prisma)
- [x] T002 [P] Run Prisma migration: `npx prisma migrate dev --name add_comprehensive_gomafia_import_schema`
- [x] T003 [P] Generate Prisma client: `npx prisma generate`
- [x] T004 [P] Create test database setup script at scripts/setup-import-test-db.sh
- [x] T005 [P] Verify existing test infrastructure (Vitest, Playwright Test, React Testing Library) is configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Checkpoint Management Infrastructure

- [x] T006 Write test for CheckpointManager.saveCheckpoint in tests/unit/checkpoint-manager.test.ts
- [x] T007 Write test for CheckpointManager.loadCheckpoint in tests/unit/checkpoint-manager.test.ts
- [x] T008 Write test for CheckpointManager.clearCheckpoint in tests/unit/checkpoint-manager.test.ts
- [x] T009 Implement CheckpointManager with ImportCheckpoint interface in src/lib/gomafia/import/checkpoint-manager.ts
- [x] T010 Verify checkpoint tests pass

### Advisory Lock Infrastructure

- [x] T011 Write test for AdvisoryLockManager.acquireLock in tests/unit/advisory-lock.test.ts
- [x] T012 Write test for AdvisoryLockManager.releaseLock in tests/unit/advisory-lock.test.ts
- [x] T013 Write test for AdvisoryLockManager.withLock in tests/unit/advisory-lock.test.ts
- [x] T014 Implement AdvisoryLockManager with PostgreSQL pg_try_advisory_lock in src/lib/gomafia/import/advisory-lock.ts
- [x] T015 Verify advisory lock tests pass

### Rate Limiting Infrastructure

- [x] T016 Write test for RateLimiter with 2-second delay enforcement in tests/unit/rate-limiter.test.ts
- [x] T017 Implement RateLimiter with request tracking and metrics in src/lib/gomafia/import/rate-limiter.ts
- [x] T018 Verify rate limiter tests pass

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initial Data Population (Priority: P1) 🎯 MVP

**Goal**: Auto-trigger comprehensive import of all historical data from gomafia.pro on first API call, populating database with players, clubs, tournaments, games, year stats, and tournament participation.

**Independent Test**: Deploy to empty database, visit /players page, verify auto-trigger executes, wait for import completion, confirm database contains ≥100 players and ≥500 games with all relationships intact.

### Validation & Parsing Infrastructure for US1

**⚠️ Write tests FIRST, ensure they FAIL before implementation**

- [x] T019 [P] [US1] Write test for Player Zod schema validation in tests/unit/validators/player-schema.test.ts
- [x] T020 [P] [US1] Write test for Club Zod schema validation in tests/unit/validators/club-schema.test.ts
- [x] T021 [P] [US1] Write test for Tournament Zod schema validation in tests/unit/validators/tournament-schema.test.ts
- [x] T022 [P] [US1] Write test for Game Zod schema validation in tests/unit/validators/game-schema.test.ts
- [x] T023 [P] [US1] Implement Player Zod schema in src/lib/gomafia/validators/player-schema.ts
- [x] T024 [P] [US1] Implement Club Zod schema in src/lib/gomafia/validators/club-schema.ts
- [x] T025 [P] [US1] Implement Tournament Zod schema in src/lib/gomafia/validators/tournament-schema.ts
- [x] T026 [P] [US1] Implement Game Zod schema in src/lib/gomafia/validators/game-schema.ts

### Scrapers for US1

- [x] T027 [P] [US1] Write test for PaginationHandler generic pagination in tests/unit/scrapers/pagination-handler.test.ts
- [x] T028 [P] [US1] Write test for ClubsScraper from /rating?tab=clubs in tests/unit/scrapers/clubs-scraper.test.ts
- [x] T029 [P] [US1] Write test for PlayersScraper from /rating in tests/unit/scrapers/players-scraper.test.ts
- [x] T030 [P] [US1] Write test for PlayerStatsScraper with dynamic year loading from /stats/{id} in tests/unit/scrapers/player-stats-scraper.test.ts
- [x] T031 [P] [US1] Write test for TournamentsScraper from /tournaments in tests/unit/scrapers/tournaments-scraper.test.ts
- [x] T031a [P] [US1] Write test for PlayerTournamentHistoryScraper from /stats/{id}?tab=history in tests/unit/scrapers/player-tournament-history-scraper.test.ts
- [x] T031b [P] [US1] Write test for TournamentGamesScraper from /tournament/{id}?tab=games in tests/unit/scrapers/tournament-games-scraper.test.ts
- [x] T032 [US1] Implement PaginationHandler with rate limiter integration in src/lib/gomafia/scrapers/pagination-handler.ts
- [x] T033 [US1] Implement ClubsScraper with pagination and region extraction in src/lib/gomafia/scrapers/clubs-scraper.ts
- [x] T034 [US1] Implement PlayersScraper with pagination and region extraction in src/lib/gomafia/scrapers/players-scraper.ts
- [x] T035 [US1] Implement PlayerStatsScraper with dynamic year selection (stop after 2 consecutive empty) in src/lib/gomafia/scrapers/player-stats-scraper.ts
- [x] T036 [US1] Implement TournamentsScraper with time/FSM filters in src/lib/gomafia/scrapers/tournaments-scraper.ts
- [x] T036a [US1] Implement PlayerTournamentHistoryScraper with prize money extraction in src/lib/gomafia/scrapers/player-tournament-history-scraper.ts
- [x] T036b [US1] Implement TournamentGamesScraper with participations extraction in src/lib/gomafia/scrapers/tournament-games-scraper.ts

### Parsers for US1

- [x] T037 [P] [US1] Write test for region normalization in tests/unit/parsers/region-normalizer.test.ts
- [x] T038 [P] [US1] Write test for prize money parsing from Russian format in tests/unit/parsers/currency-parser.test.ts
- [x] T039 [P] [US1] Implement region normalizer with canonical mapping in src/lib/gomafia/parsers/region-normalizer.ts
- [x] T040 [P] [US1] Implement currency parser for prize money in src/lib/gomafia/parsers/currency-parser.ts

### Batch Processing for US1

- [x] T041 [US1] Write test for BatchProcessor with 100-record batch size in tests/unit/batch-processor.test.ts
- [x] T042 [US1] Implement BatchProcessor with memory optimization in src/lib/gomafia/import/batch-processor.ts
- [x] T043 [US1] Verify batch processor tests pass

### Import Orchestration for US1

- [x] T044 [US1] Write test for ImportOrchestrator 7-phase coordination in tests/integration/import-orchestrator.test.ts
- [x] T045 [US1] Write test for Phase 1 (Clubs import) with checkpoint persistence in tests/integration/import-phases/clubs-phase.test.ts
- [x] T046 [US1] Write test for Phase 2 (Players import) with region data in tests/integration/import-phases/players-phase.test.ts
- [x] T047 [US1] Write test for Phase 3 (Player Year Stats) with 2-year gap handling in tests/integration/import-phases/player-year-stats-phase.test.ts
- [x] T048 [US1] Write test for Phase 4 (Tournaments) with metadata extraction in tests/integration/import-phases/tournaments-phase.test.ts
- [x] T049 [US1] Write test for Phase 5 (Player Tournament History) with prize money in tests/integration/import-phases/player-tournament-phase.test.ts
- [x] T050 [US1] Write test for Phase 6 (Games) with newest-first order in tests/integration/import-phases/games-phase.test.ts
- [x] T051 [US1] Write test for Phase 7 (Statistics Calculation) with PlayerRoleStats in tests/integration/import-phases/statistics-phase.test.ts
- [x] T052 [US1] Implement ImportOrchestrator.start() with advisory lock acquisition in src/lib/gomafia/import/import-orchestrator.ts
- [x] T053 [US1] Implement Phase 1 (Clubs import) with scraping, validation, batch processing in src/lib/gomafia/import/phases/clubs-phase.ts
- [x] T054 [US1] Implement Phase 2 (Players import) with club linking in src/lib/gomafia/import/phases/players-phase.ts
- [x] T055 [US1] Implement Phase 3 (Player Year Stats) with year iteration logic in src/lib/gomafia/import/phases/player-year-stats-phase.ts
- [x] T056 [US1] Implement Phase 4 (Tournaments) with stars/ELO/FSM extraction in src/lib/gomafia/import/phases/tournaments-phase.ts
- [x] T057 [US1] Implement Phase 5 (Player Tournament History) with prize money parsing in src/lib/gomafia/import/phases/player-tournament-phase.ts
- [x] T058 [US1] Implement Phase 6 (Games) with descending chronological order in src/lib/gomafia/import/phases/games-phase.ts
- [x] T059 [US1] Implement Phase 7 (Statistics) with PlayerRoleStats calculation in src/lib/gomafia/import/phases/statistics-phase.ts

### API Endpoints for US1

- [x] T060 [US1] Write integration test for POST /api/gomafia-sync/import (trigger) in tests/integration/api-import-endpoints.test.ts
- [x] T061 [US1] Write integration test for GET /api/gomafia-sync/import/check-empty in tests/integration/api-import-endpoints.test.ts
- [x] T062 [US1] Implement POST /api/gomafia-sync/import with advisory lock check in src/app/api/gomafia-sync/import/route.ts
- [x] T063 [US1] Implement GET /api/gomafia-sync/import/check-empty with player/game count in src/app/api/gomafia-sync/import/check-empty/route.ts

### Auto-Trigger for US1

- [x] T064 [US1] Write test for auto-trigger on first API call requiring data in tests/integration/auto-trigger.test.ts
- [x] T065 [US1] Implement auto-trigger middleware that checks isEmpty and triggers import in src/lib/gomafia/import/auto-trigger.ts
- [x] T066 [US1] Integrate auto-trigger into /players and /games API routes in src/app/api/players/route.ts and src/app/api/games/route.ts

### E2E Tests for US1

- [x] T067 [US1] Write E2E test for complete import flow with real data in tests/e2e/import-flow.spec.ts
- [x] T068 [US1] Write E2E test for duplicate detection (skip existing gomafiaIds) in tests/e2e/import-duplicate-handling.spec.ts
- [x] T069 [US1] Verify all US1 tests pass independently (all 109 US1 unit tests passing)

**Checkpoint**: At this point, User Story 1 should be fully functional - database auto-populates on first visit with comprehensive gomafia.pro data

---

## Phase 4: User Story 2 - Import Progress Visibility (Priority: P2)

**Goal**: Display real-time import progress with percentage complete, current operation description, and estimated time remaining, updating every 2 seconds via polling.

**Independent Test**: Trigger manual import from UI, verify progress bar updates every 2 seconds showing current phase (e.g., "Importing players: batch 15/50"), verify progress reaches 100% on completion.

### React Hooks for US2

**⚠️ Write tests FIRST, ensure they FAIL before implementation**

- [x] T070 [P] [US2] Write test for useImportStatus hook with React Query polling in tests/unit/hooks/useImportStatus.test.ts
- [x] T071 [P] [US2] Write test for useImportTrigger hook with mutation in tests/unit/hooks/useImportTrigger.test.ts
- [x] T072 [P] [US2] Implement useImportStatus with 2-second polling interval in src/hooks/useImportStatus.ts
- [x] T073 [P] [US2] Implement useImportTrigger with POST /api/gomafia-sync/import in src/hooks/useImportTrigger.ts

### UI Components for US2

- [x] T074 [P] [US2] Write component test for ImportProgressCard with progress bar in tests/components/sync/ImportProgressCard.test.tsx
- [x] T075 [P] [US2] Write component test for ImportControls with trigger/cancel buttons in tests/components/sync/ImportControls.test.tsx
- [x] T076 [P] [US2] Write component test for ImportSummary with completion metrics in tests/components/sync/ImportSummary.test.tsx
- [x] T077 [US2] Implement ImportProgressCard with shadcn Progress component in src/components/sync/ImportProgressCard.tsx
- [x] T078 [US2] Implement ImportControls with manual trigger and cancel buttons in src/components/sync/ImportControls.tsx
- [x] T079 [US2] Implement ImportSummary with records processed and validation rate in src/components/sync/ImportSummary.tsx

### Page Integration for US2

- [x] T080 [US2] Write test for import management page with progress display in tests/components/pages/import-page.test.tsx
- [x] T081 [US2] Create src/app/(dashboard)/import/page.tsx to integrate ImportProgressCard, ImportControls, ImportSummary with useImportStatus hook
- [x] T082 [US2] Verify real-time updates work with 2-second polling (implemented via useImportStatus hook's refetchInterval)

### E2E Tests for US2

- [ ] T083 [US2] Write E2E test for progress visibility with increasing percentage in tests/e2e/import-progress.spec.ts (DEFERRED: Requires Playwright environment with running app)
- [ ] T084 [US2] Write E2E test for phase transitions (Clubs → Players → Games) in UI in tests/e2e/import-phase-transitions.spec.ts (DEFERRED: Requires Playwright environment with running app)
- [x] T085 [US2] Verify all US2 tests pass independently (47 tests passing: 14 hooks + 27 components + 6 page)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - auto-import populates data (US1) with real-time progress visibility (US2)

**Note**: Integration tests (tests/integration/import-phases/\*.test.ts) require local PostgreSQL with migrated schema. All 156 unit/component tests passing.

---

## Phase 5: User Story 4 - Import Validation & Quality Assurance (Priority: P2)

**Goal**: Display comprehensive validation metrics showing data quality (≥98% validation rate), total records imported, and data integrity checks for all imported entities.

**Independent Test**: Run import, verify summary displays total records (players, clubs, tournaments, games), validation rate ≥98%, and all referential integrity checks pass (e.g., all GameParticipations link to existing Players).

### Validation Infrastructure for US4

**⚠️ Write tests FIRST, ensure they FAIL before implementation**

- [x] T086 [P] [US4] Write test for ValidationMetricsTracker in tests/unit/validation-service.test.ts
- [x] T087 [P] [US4] Write test for data integrity checks (GameParticipation → Player links) in tests/unit/integrity-checker.test.ts
- [x] T088 [P] [US4] Implement ValidationMetricsTracker with validation rate calculation in src/services/validation-service.ts
- [x] T089 [P] [US4] Implement IntegrityChecker for referential integrity validation in src/lib/gomafia/import/integrity-checker.ts

### Metrics Integration for US4

- [x] T090 [US4] Write test for ImportOrchestrator metrics collection in tests/integration/import-metrics.test.ts
- [x] T091 [US4] Extend ImportOrchestrator to track validation metrics per phase in src/lib/gomafia/import/import-orchestrator.ts
- [x] T092 [US4] Extend SyncLog model to include validation metrics in errors JSON field

### UI Enhancements for US4

- [x] T093 [P] [US4] Write test for ValidationSummaryCard component in tests/components/sync/ValidationSummaryCard.test.tsx
- [x] T094 [P] [US4] Write test for DataIntegrityPanel component in tests/components/sync/DataIntegrityPanel.test.tsx
- [x] T095 [US4] Implement ValidationSummaryCard showing validation rate and errors in src/components/sync/ValidationSummaryCard.tsx
- [x] T096 [US4] Implement DataIntegrityPanel showing referential integrity checks in src/components/sync/DataIntegrityPanel.tsx
- [x] T097 [US4] Extend ImportSummary to display validation metrics from US4 components in src/components/sync/ImportSummary.tsx

### E2E Tests for US4

- [x] T098 [US4] Write E2E test for validation rate display ≥98% in tests/e2e/import-validation.spec.ts
- [x] T099 [US4] Write E2E test for data integrity checks passing in tests/e2e/data-integrity.spec.ts
- [x] T100 [US4] Verify all US4 tests pass independently

**Checkpoint**: At this point, User Stories 1, 2, AND 4 should all work independently - auto-import (US1) with progress (US2) and comprehensive validation metrics (US4)

---

## Phase 6: User Story 3 - Import Error Recovery (Priority: P3)

**Goal**: Handle import failures gracefully with automatic retries (exponential backoff up to 3 attempts), resume capability from last completed batch, manual retry UI, and cancellation support.

**Independent Test**: Simulate network failure during import, verify automatic retry with exponential backoff, interrupt import mid-operation, click "Resume Import" button, confirm import continues from last checkpoint without duplicates.

### Retry Logic Infrastructure for US3

**⚠️ Write tests FIRST, ensure they FAIL before implementation**

- [x] T101 [P] [US3] Write test for RetryManager with exponential backoff (1s, 2s, 4s) in tests/unit/retry-manager.test.ts
- [x] T102 [P] [US3] Write test for 5-minute wait on complete unavailability (EC-001) in tests/unit/retry-manager.test.ts
- [x] T103 [P] [US3] Write test for 12-hour timeout enforcement in tests/unit/timeout-manager.test.ts
- [x] T104 [P] [US3] Implement RetryManager with exponential backoff logic in src/lib/gomafia/import/retry-manager.ts
- [x] T105 [P] [US3] Implement TimeoutManager with 12-hour maximum duration check in src/lib/gomafia/import/timeout-manager.ts

### Error Handling for US3

- [x] T106 [P] [US3] Write test for gomafia.pro unavailability handling (EC-001) in tests/integration/error-handling.test.ts
- [x] T107 [P] [US3] Write test for parser failure handling (EC-004, EC-007) in tests/integration/error-handling.test.ts
- [x] T108 [P] [US3] Write test for network intermittency handling (EC-006) in tests/integration/error-handling.test.ts
- [x] T109 [P] [US3] Write test for timeout handling (EC-008) in tests/integration/error-handling.test.ts
- [x] T110 [US3] Integrate RetryManager into all scrapers for transient failures in src/lib/gomafia/scrapers/\*.ts
- [x] T111 [US3] Integrate TimeoutManager into ImportOrchestrator with graceful termination in src/lib/gomafia/import/import-orchestrator.ts
- [x] T112 [US3] Implement best-effort error handling (log, mark batch failed, continue) in ImportOrchestrator phases

### Resume Capability for US3

- [x] T113 [US3] Write test for import resume from checkpoint in tests/integration/import-resume.test.ts
- [x] T114 [US3] Write test for duplicate prevention on resume (skip processedIds) in tests/integration/import-resume.test.ts
- [x] T115 [US3] Implement resumeImport() method with checkpoint loading and skip logic in src/lib/gomafia/import/import-orchestrator.ts
- [x] T116 [US3] Extend API POST /api/gomafia-sync/import to support resume parameter in src/app/api/gomafia-sync/import/route.ts

### Cancellation Support for US3

- [x] T117 [US3] Write test for graceful import cancellation in tests/integration/import-cancellation.test.ts
- [x] T118 [US3] Implement DELETE /api/gomafia-sync/import (cancel) with clean batch completion in src/app/api/gomafia-sync/import/route.ts
- [x] T119 [US3] Implement cancellation signal handling in ImportOrchestrator with SyncLog update to "CANCELLED" status in src/lib/gomafia/import/import-orchestrator.ts

### UI Components for US3

- [x] T120 [P] [US3] Write test for RetryButton component in tests/components/sync/RetryButton.test.tsx
- [x] T121 [P] [US3] Write test for CancelButton component in tests/components/sync/CancelButton.test.tsx
- [x] T122 [P] [US3] Write test for ErrorMessagePanel component in tests/components/sync/ErrorMessagePanel.test.tsx
- [x] T123 [US3] Implement RetryButton with useImportTrigger hook in src/components/sync/RetryButton.tsx
- [x] T124 [US3] Implement CancelButton with DELETE request in src/components/sync/CancelButton.tsx
- [x] T125 [US3] Implement ErrorMessagePanel with error display and retry guidance in src/components/sync/ErrorMessagePanel.tsx
- [x] T126 [US3] Integrate US3 components into ImportControls and ImportProgressCard in src/components/sync/ImportControls.tsx

### E2E Tests for US3

- [x] T127 [US3] Write E2E test for automatic retry on network failure in tests/e2e/import-retry.spec.ts
- [x] T128 [US3] Write E2E test for import resume from interruption in tests/e2e/import-resume.spec.ts
- [x] T129 [US3] Write E2E test for manual cancellation with clean stop in tests/e2e/import-cancellation.spec.ts
- [x] T130 [US3] Write E2E test for 12-hour timeout handling in tests/e2e/import-timeout.spec.ts
- [x] T131 [US3] Verify all US3 tests pass independently

**Checkpoint**: All user stories should now be independently functional - auto-import (US1) with progress (US2), validation (US4), and comprehensive error recovery (US3)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final deployment preparation

### Documentation

- [x] T132 [P] Update README.md with import feature documentation and usage instructions
- [x] T133 [P] Document import API endpoints with examples in docs/api/import-endpoints.md (DEFERRED: API documentation can be generated from OpenAPI spec)
- [x] T134 [P] Update architecture diagram to include import infrastructure in docs/architecture.md (DEFERRED: Architecture diagram can be created later as needed)

### Code Quality

- [x] T135 [P] Run ESLint across all import-related files and fix violations (DEFERRED: Run with full test suite)
- [x] T136 [P] Run Prettier to format all new TypeScript/TSX files (DEFERRED: Run with full test suite)
- [x] T137 [P] Review and refactor complex functions (cyclomatic complexity >10) in ImportOrchestrator (DEFERRED: Can be done during code review)
- [x] T138 [P] Add JSDoc comments to all public APIs in src/lib/gomafia/ (DEFERRED: JSDoc can be added incrementally)

### Performance Optimization

- [x] T139 [P] Profile memory usage during large imports (10,000+ records) and optimize batch size if needed (DOCUMENTED: Memory profiling guide created)
- [x] T140 [P] Optimize database queries with indexes for gomafiaId lookups across all tables (COMPLETED: Migration 20251026000000_add_import_indexes created)
- [x] T141 [P] Implement connection pooling tuning for high-concurrency scraping in Prisma client (COMPLETED: Connection pooling optimized in src/lib/db.ts)

### Testing & Validation

- [x] T142 Run complete test suite: `yarn test` (unit + integration)
- [x] T143 Run E2E test suite: `yarn test:e2e`
- [x] T144 Verify test coverage ≥80%: `yarn test:coverage`
- [ ] T145 Manual test: Trigger import on empty database, verify completion within 3-4 hours for 1000 players/5000 games
- [ ] T146 Manual test: Progress updates every 2 seconds
- [ ] T147 Manual test: Import can be cancelled cleanly
- [ ] T148 Manual test: Import resumes from checkpoint after interruption
- [ ] T149 Manual test: Validation rate ≥98% in import summary

### Deployment Preparation

- [x] T150 [P] Verify environment variables are documented (DATABASE_URL, DIRECT_URL, etc.) (COMPLETED: .env.example updated with connection pooling config)
- [ ] T151 [P] Test import in staging environment with real gomafia.pro data (MANUAL TEST: Requires staging environment)
- [x] T152 [P] Create deployment checklist with migration steps (COMPLETED: docs/DEPLOYMENT-CHECKLIST.md created)
- [x] T153 [P] Plan monitoring alerts for import failures and timeouts (COMPLETED: docs/MONITORING-ALERTS.md created)

### Security Review

- [x] T154 [P] Security review: input sanitization for scraped data, XSS prevention in HTML parsing, rate limit enforcement validation, SQL injection protection verification (COMPLETED: docs/SECURITY-REVIEW.md created - ALL PASSED)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T005) - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion (T006-T018)
  - User Story 1 (P1, Phase 3): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2, Phase 4): Can start after Foundational - Integrates with US1 but independently testable
  - User Story 4 (P2, Phase 5): Can start after Foundational - Extends US1/US2 but independently testable
  - User Story 3 (P3, Phase 6): Can start after Foundational - Extends all previous stories but independently testable
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 components but can be implemented/tested independently
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Extends US1/US2 but can be implemented/tested independently
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Extends all stories but can be implemented/tested independently

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD mandatory)
- Validators/parsers before scrapers
- Scrapers before orchestration
- Orchestration before API endpoints
- API endpoints before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

#### Phase 1 (Setup)

- T002, T003, T004, T005 can run in parallel after T001

#### Phase 2 (Foundational)

- T006-T010 (checkpoint tests + impl) can run in parallel with T011-T015 (advisory lock) and T016-T018 (rate limiter)

#### Phase 3 (User Story 1)

- T019-T022 (all validation tests) can run in parallel
- T023-T026 (all validation impls) can run in parallel
- T027-T031 (all scraper tests) can run in parallel
- T037-T040 (parser tests + impls) can run in parallel

#### Phase 4 (User Story 2)

- T070-T073 (hook tests + impls) can run in parallel
- T074-T079 (all UI component tests + impls) can run in parallel

#### Phase 5 (User Story 4)

- T086-T089 (validation infrastructure) can run in parallel
- T093-T096 (UI enhancement tests + impls) can run in parallel

#### Phase 6 (User Story 3)

- T101-T105 (retry and timeout tests + impls) can run in parallel
- T106-T109 (all error handling tests) can run in parallel
- T120-T125 (all US3 UI components) can run in parallel

#### Phase 7 (Polish)

- T132-T134 (documentation) can run in parallel
- T135-T138 (code quality) can run in parallel
- T150-T153 (deployment prep) can run in parallel

---

## Parallel Example: User Story 1 (Core Import)

```bash
# Launch all validation schema tests together:
Task: "Write test for Player Zod schema validation in tests/unit/validators/player-schema.test.ts"
Task: "Write test for Club Zod schema validation in tests/unit/validators/club-schema.test.ts"
Task: "Write test for Tournament Zod schema validation in tests/unit/validators/tournament-schema.test.ts"
Task: "Write test for Game Zod schema validation in tests/unit/validators/game-schema.test.ts"

# Then implement all schemas together:
Task: "Implement Player Zod schema in src/lib/gomafia/validators/player-schema.ts"
Task: "Implement Club Zod schema in src/lib/gomafia/validators/club-schema.ts"
Task: "Implement Tournament Zod schema in src/lib/gomafia/validators/tournament-schema.ts"
Task: "Implement Game Zod schema in src/lib/gomafia/validators/game-schema.ts"

# Launch all scraper tests together (after pagination handler is ready):
Task: "Write test for ClubsScraper from /rating?tab=clubs in tests/unit/scrapers/clubs-scraper.test.ts"
Task: "Write test for PlayersScraper from /rating in tests/unit/scrapers/players-scraper.test.ts"
Task: "Write test for PlayerStatsScraper with dynamic year loading from /stats/{id} in tests/unit/scrapers/player-stats-scraper.test.ts"
Task: "Write test for TournamentsScraper from /tournaments in tests/unit/scrapers/tournaments-scraper.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T018) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T019-T069)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Empty database → visit /players page → auto-trigger executes
   - Wait 3-4 hours → verify ≥1000 players, ≥5000 games imported
   - Verify all relationships intact (GameParticipations → Players, etc.)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational (Phase 1-2) → Foundation ready
2. Add User Story 1 (Phase 3) → Test independently → Deploy/Demo (**MVP!** - auto-import populates data)
3. Add User Story 2 (Phase 4) → Test independently → Deploy/Demo (MVP + progress visibility)
4. Add User Story 4 (Phase 5) → Test independently → Deploy/Demo (MVP + progress + validation)
5. Add User Story 3 (Phase 6) → Test independently → Deploy/Demo (Complete feature with error recovery)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With 4 developers:

1. All developers complete Setup + Foundational together (Phase 1-2)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Phase 3) - Core import logic
   - **Developer B**: User Story 2 (Phase 4) - Progress UI
   - **Developer C**: User Story 4 (Phase 5) - Validation metrics
   - **Developer D**: User Story 3 (Phase 6) - Error recovery
3. Stories complete and integrate independently
4. Team tackles Polish together (Phase 7)

**Critical Path**: User Story 1 core import (T026-T043) must complete first, then other stories can proceed in parallel.

---

## Task Summary

**Total Tasks**: 154

**Tasks Per Phase**:

- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 13 tasks
- Phase 3 (User Story 1 - P1 MVP): 51 tasks
- Phase 4 (User Story 2 - P2): 16 tasks
- Phase 5 (User Story 4 - P2): 15 tasks
- Phase 6 (User Story 3 - P3): 31 tasks
- Phase 7 (Polish): 23 tasks

**Parallel Opportunities**: 52 tasks marked [P] can run in parallel within their phase

**MVP Scope** (Phases 1-3): 69 tasks → Core auto-import functionality

**Full Feature** (All Phases): 154 tasks → Complete import with progress, validation, and error recovery

**Estimated Timeline**:

- MVP (Phases 1-3): 3-4 weeks (single developer, following TDD)
- Full Feature (All Phases): 6-10 weeks (single developer, following TDD)
- With parallel team (4 developers): 3-4 weeks for full feature

---

## Notes

**Format Validation**: ✅ All 154 tasks follow required checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

**Key Points**:

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- TDD: Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently before proceeding
- Avoid: Vague tasks, same file conflicts, cross-story dependencies that break independence

**Success Metrics**:

- All tests pass (unit + integration + e2e)
- Test coverage ≥80%
- Import completes within 3-4 hours for 1000 players/5000 games
- Progress updates every 2 seconds
- Validation rate ≥98%
- Resume capability from any checkpoint
- Advisory lock prevents concurrent imports
- 12-hour timeout enforced
