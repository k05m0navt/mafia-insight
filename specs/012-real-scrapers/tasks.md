---
description: 'Task list for replacing mock scrapers with real scrapers in admin import workflow'
---

# Tasks: Replace Mock Scrapers with Real Scrapers

**Input**: Design documents from `/specs/012-real-scrapers/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are OPTIONAL for this refactoring task. Unit tests and integration tests are included to ensure the refactor works correctly.

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App**: Single project structure with `src/app/` for routes and `src/lib/` for library code
- Paths shown below reflect the existing Next.js structure
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure verification

**Note**: This is a refactoring task, so most infrastructure already exists. We verify dependencies and prepare for implementation.

- [x] T001 Verify Playwright browser installation with `npx playwright install chromium`
- [x] T002 [P] Verify all Phase classes exist in `src/lib/gomafia/import/phases/`
- [x] T003 [P] Verify ImportOrchestrator (7-phase) exists in `src/lib/gomafia/import/import-orchestrator.ts`
- [x] T004 [P] Verify ImportOrchestrator (singleton) exists in `src/lib/gomafia/import/orchestrator.ts`
- [x] T005 [P] Verify AdvisoryLockManager exists in `src/lib/gomafia/import/advisory-lock.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Verify Phase class constructors accept ImportOrchestrator (7-phase) instance
- [x] T007 Verify Phase classes have `execute()` method that returns Promise<void>
- [x] T008 Verify ImportOrchestrator (singleton) has `startImport()`, `updateProgress()`, `completeImport()`, and `failImport()` methods
- [x] T009 Verify advisory lock pattern works with `acquireLock()` and `releaseLock()`
- [x] T010 [P] Verify all scrapers exist and are functional in `src/lib/gomafia/scrapers/`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Admin Manual Import Uses Real Scrapers (Priority: P1) 🎯 MVP

**Goal**: Replace mock data generation in `/api/admin/import/start` with real Playwright-based scrapers from gomafia.pro. Each admin strategy button runs its corresponding Phase class with actual data scraping.

**Independent Test**: Navigate to `/admin/import`, click "Start Import" for Players strategy, verify in database that imported players have valid gomafiaId values and real names from gomafia.pro (not "Player 1", "Player 2" etc.)

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] Unit test for strategy-to-phase mapping in `tests/unit/api/admin/strategy-phase-mapping.test.ts`
- [ ] T012 [P] [US1] Integration test for Players import in `tests/integration/admin-import-players.test.ts`
- [ ] T013 [P] [US1] Integration test for Clubs import in `tests/integration/admin-import-clubs.test.ts`
- [ ] T014 [P] [US1] Integration test for advisory lock prevention in `tests/integration/admin-import-lock.test.ts`

### Implementation for User Story 1

- [x] T015 [US1] Refactor `/api/admin/import/start` POST handler to remove generateSampleData and mock interfaces in `src/app/api/admin/import/start/route.ts`
- [x] T016 [US1] Add browser launch and cleanup logic in `src/app/api/admin/import/start/route.ts`
- [x] T017 [US1] Create strategy-to-phase mapping helper function in `src/app/api/admin/import/start/route.ts`
- [x] T018 [US1] Integrate ImportOrchestrator (7-phase) instantiation in `src/app/api/admin/import/start/route.ts`
- [x] T019 [US1] Execute selected Phase class with orchestrator in `src/app/api/admin/import/start/route.ts`
- [x] T020 [US1] Add advisory lock acquisition/release with proper error handling in `src/app/api/admin/import/start/route.ts`
- [x] T021 [US1] Integrate progress tracking via ImportOrchestrator (singleton) in `src/app/api/admin/import/start/route.ts`
- [x] T022 [US1] Add background execution pattern with proper error handling and cleanup in `src/app/api/admin/import/start/route.ts`
- [x] T023 [US1] Add comprehensive error handling for browser launch, scraper failures, and validation errors in `src/app/api/admin/import/start/route.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Admin can trigger Players, Clubs, Tournaments, Games, Player Stats, and Tournament Results imports with real scrapers.

---

## Phase 4: User Story 2 - Enhanced Error Handling and Logging (Priority: P2)

**Goal**: Improve error handling, retry logic, and logging for production readiness

**Independent Test**: Trigger import with gomafia.pro temporarily unavailable, verify graceful retry with exponential backoff and proper error reporting in admin dashboard.

### Tests for User Story 2 (OPTIONAL) ⚠️

- [ ] T024 [P] [US2] Unit test for retry logic in `tests/unit/api/admin/import-retry.test.ts`
- [ ] T025 [P] [US2] Integration test for network failure handling in `tests/integration/admin-import-failure.test.ts`

### Implementation for User Story 2

- [ ] T026 [US2] Enhance error messages with specific error codes in `src/app/api/admin/import/start/route.ts`
- [ ] T027 [US2] Add structured logging for import lifecycle events in `src/app/api/admin/import/start/route.ts`
- [ ] T028 [US2] Verify Phase classes handle retries with rate limiter in existing Phase implementation

**Checkpoint**: Enhanced error handling and logging implemented for production use

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensure production readiness

**Status**: MVP delivered with US1. Polish tasks are optional and can be completed post-MVP.

- [ ] T029 [P] Update E2E test to verify real data in `tests/e2e/admin-import.spec.ts`
- [ ] T030 [P] Performance benchmarking: Measure import times for each strategy and compare with success criteria in documentation
- [ ] T031 [P] Validation rate verification: Ensure ≥95% validation rate for all imports in production logs
- [x] T037 [P] [OPT] Implement parallel browser contexts for player stats scraping in `src/lib/gomafia/import/phases/player-year-stats-phase.ts`
- [x] T038 [P] [OPT] Optimize page wait strategies from networkidle to domcontentloaded in `src/lib/gomafia/scrapers/player-stats-scraper.ts`
- [x] T039 [P] [OPT] Add resource blocking (images, fonts, media) in `src/lib/gomafia/import/phases/player-year-stats-phase.ts`
- [x] T040 [P] [OPT] Optimize wait timeouts and remove unnecessary delays in `src/lib/gomafia/scrapers/player-stats-scraper.ts`
- [x] T041 [P] [OPT] Implement batch database inserts instead of per-player inserts in `src/lib/gomafia/import/phases/player-year-stats-phase.ts`
- [x] T042 [P] [OPT] Add retry logic for page navigation timeouts in `src/lib/gomafia/scrapers/player-stats-scraper.ts` and `retry-manager.ts`
- [x] T043 [P] [OPT] Fix import status race condition - clear progress interval before completion in `src/app/api/admin/import/start/route.ts`
- [x] T032 [P] Code cleanup: Remove any remaining references to generateSampleData or mock data patterns
- [ ] T033 [P] Documentation update: Add examples and troubleshooting guide in `docs/admin-import.md`
- [x] T034 [P] Update OpenAPI contract documentation if needed in `specs/012-real-scrapers/contracts/admin-import-api.yaml`
- [x] T035 Verify quickstart.md validation checklist items in `specs/012-real-scrapers/quickstart.md`
- [ ] T036 Run full test suite and ensure all existing tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Enhances US1 but is independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Helper functions before main implementation
- Core implementation before integration
- Error handling throughout implementation
- Story complete before moving to next priority

### Parallel Opportunities

- **Setup phase**: T002, T003, T004, T005 can run in parallel
- **Foundational phase**: T010 can run independently
- **User Story 1 tests**: T011, T012, T013, T014 can run in parallel (write all tests together)
- **User Story 2 tests**: T024, T025 can run in parallel
- **Polish phase**: T029, T030, T031, T032, T033, T034, T035 can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for strategy-to-phase mapping in tests/unit/api/admin/strategy-phase-mapping.test.ts"
Task: "Integration test for Players import in tests/integration/admin-import-players.test.ts"
Task: "Integration test for Clubs import in tests/integration/admin-import-clubs.test.ts"
Task: "Integration test for advisory lock prevention in tests/integration/admin-import-lock.test.ts"

# Implementation tasks run sequentially within the main POST handler refactor:
Task: "Refactor /api/admin/import/start POST handler to remove generateSampleData"
Task: "Add browser launch and cleanup logic"
Task: "Create strategy-to-phase mapping helper function"
Task: "Integrate ImportOrchestrator (7-phase) instantiation"
Task: "Execute selected Phase class with orchestrator"
... etc
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup - Verify all infrastructure exists
2. Complete Phase 2: Foundational - Verify Phase classes and ImportOrchestrator
3. Complete Phase 3: User Story 1 - Replace mock data with real scrapers
4. **STOP and VALIDATE**: Test User Story 1 independently with real Players import
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently with real scrapers → Deploy/Demo (MVP!)
3. Add User Story 2 → Enhance error handling → Deploy/Demo
4. Polish phase → Production hardening → Final deployment

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: Write all User Story 1 tests (T011-T014 in parallel)
   - Developer B: Refactor POST handler (T015-T023 sequentially)
3. After MVP delivery:
   - Developer A: User Story 2 enhancements
   - Developer B: Polish phase and documentation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (especially strategy-to-phase mapping)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: Same file conflicts, cross-story dependencies that break independence
- Critical reference: Use `startImportInBackground` from `/api/gomafia-sync/import/route.ts` as pattern for browser management and Phase execution

## Task Summary

**Total Tasks**: 39  
**User Story 1 Tasks**: 13 (4 test tasks, 9 implementation tasks)  
**User Story 2 Tasks**: 5 (2 test tasks, 3 implementation tasks)  
**Setup Tasks**: 5  
**Foundational Tasks**: 5  
**Polish Tasks**: 11

**Parallel Opportunities**:

- Setup: 4 tests can run in parallel
- User Story 1: 4 test tasks can run in parallel
- User Story 2: 2 test tasks can run in parallel
- Polish: 6 tasks can run in parallel

**Independent Test Criteria**:

- US1: Navigate to `/admin/import`, click "Start Import" for Players strategy, verify in database that imported players have valid gomafiaId values and real names from gomafia.pro
- US2: Trigger import with gomafia.pro temporarily unavailable, verify graceful retry with exponential backoff and proper error reporting

**Suggested MVP Scope**: Just User Story 1 (Phase 3). This delivers the core functionality of replacing mock scrapers with real scrapers for all 6 admin strategies.
