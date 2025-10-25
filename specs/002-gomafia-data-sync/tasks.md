# Tasks: Gomafia Data Integration

**Input**: Design documents from `/specs/002-gomafia-data-sync/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED as per constitution. TDD approach with tests written first.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below based on Next.js web application structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [x] T001 Install Playwright for browser automation with `yarn add playwright`
- [x] T002 Install Playwright test dependencies with `yarn add -D @playwright/test`
- [x] T003 [P] Configure Playwright browsers with `npx playwright install chromium`
- [x] T004 [P] Update environment variables in `.env.local` with sync configuration
- [x] T005 [P] Add sync-related environment variables to `.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create database migration for SyncLog model in `prisma/migrations/[timestamp]_add_sync_tables/migration.sql`
- [x] T007 Create database migration for SyncStatus model in `prisma/migrations/[timestamp]_add_sync_tables/migration.sql`
- [x] T008 [P] Update Player model with sync tracking fields (lastSyncAt, syncStatus) in `prisma/schema.prisma`
- [x] T009 [P] Update Game model with sync tracking fields (lastSyncAt, syncStatus) in `prisma/schema.prisma`
- [x] T010 Generate Prisma client with `yarn db:generate`
- [x] T011 Apply database migrations with `yarn db:migrate` - Applied via Supabase MCP
- [x] T012 Create Zod validation schemas for SyncLog in `src/lib/validations/syncSchemas.ts`
- [x] T013 Create Zod validation schemas for Player sync data in `src/lib/validations/playerSchemas.ts`
- [x] T014 Create Zod validation schemas for Game sync data in `src/lib/validations/gameSchemas.ts`
- [x] T015 [P] Configure cron job scheduling infrastructure in `src/lib/jobs/cronConfig.ts`
- [x] T016 [P] Setup error handling and logging for sync operations in `src/lib/errorTracking/syncErrors.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Data Synchronization (Priority: P1) 🎯 MVP

**Goal**: System automatically fetches and syncs all player and game data from gomafia.pro

**Independent Test**: Successfully parse data from gomafia.pro, store it in database, and verify it's accessible

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T017 [P] [US1] Unit test for player parsing logic in `tests/unit/parsers/gomafiaParser.test.ts`
- [x] T018 [P] [US1] Unit test for game parsing logic in `tests/unit/parsers/gomafiaParser.test.ts`
- [x] T019 [P] [US1] Integration test for full sync workflow in `tests/integration/sync/fullSync.test.ts`
- [x] T020 [P] [US1] Integration test for incremental sync workflow in `tests/integration/sync/incrementalSync.test.ts`
- [x] T021 [P] [US1] Integration test for retry logic in `tests/integration/sync/retryLogic.test.ts`

### Implementation for User Story 1

- [x] T022 [US1] Implement Playwright browser launcher in `src/lib/parsers/gomafiaParser.ts`
- [x] T023 [US1] Implement player data scraping from gomafia.pro in `src/lib/parsers/gomafiaParser.ts`
- [x] T024 [US1] Implement game data scraping from gomafia.pro in `src/lib/parsers/gomafiaParser.ts`
- [x] T025 [US1] Implement retry logic with exponential backoff in `src/lib/parsers/gomafiaParser.ts`
- [x] T026 [US1] Implement data transformation for Player entities in `src/lib/parsers/transformPlayer.ts`
- [x] T027 [US1] Implement data transformation for Game entities in `src/lib/parsers/transformGame.ts`
- [x] T028 [US1] Create SyncJob service for orchestrating sync operations in `src/lib/jobs/syncJob.ts`
- [x] T029 [US1] Implement batch processing logic in `src/lib/jobs/syncJob.ts`
- [x] T030 [US1] Implement full sync functionality in `src/lib/jobs/syncJob.ts`
- [x] T031 [US1] Implement incremental sync functionality in `src/lib/jobs/syncJob.ts`
- [x] T032 [US1] Create SyncLog database operations in `src/lib/db/syncLog.ts`
- [x] T033 [US1] Create SyncStatus database operations in `src/lib/db/syncStatus.ts`
- [x] T034 [US1] Implement Player sync operations in `src/lib/db/syncPlayer.ts`
- [x] T035 [US1] Implement Game sync operations in `src/lib/db/syncGame.ts`
- [x] T036 [US1] Add logging for sync operations in `src/lib/jobs/syncJob.ts`
- [x] T037 [US1] Implement cron job scheduler for daily sync in `src/lib/jobs/cronScheduler.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Data Display in Web App (Priority: P2)

**Goal**: Users can view all synchronized gomafia data in the web application with pagination and filtering

**Independent Test**: Display player data, game records, and basic statistics in the web interface using shadcn components

### Tests for User Story 2 ⚠️

- [x] T038 [P] [US2] Integration test for player list API in `tests/integration/api/players.test.ts`
- [x] T039 [P] [US2] Integration test for game list API in `tests/integration/api/games.test.ts`
- [x] T040 [P] [US2] E2E test for player list page in `tests/e2e/players.spec.ts`
- [x] T041 [P] [US2] E2E test for game list page in `tests/e2e/games.spec.ts`

### Implementation for User Story 2

- [x] T042 [US2] Create API route for player list with pagination in `src/app/api/players/route.ts`
- [x] T043 [US2] Create API route for player details in `src/app/api/players/[id]/route.ts`
- [x] T044 [US2] Create API route for game list with pagination in `src/app/api/games/route.ts`
- [x] T045 [US2] Create API route for game details in `src/app/api/games/[id]/route.ts`
- [x] T046 [US2] Create player list page component in `src/app/(dashboard)/players/page.tsx`
- [x] T047 [US2] Create player details page component in `src/app/(dashboard)/players/[id]/page.tsx`
- [x] T048 [US2] Create game list page component in `src/app/(dashboard)/games/page.tsx`
- [x] T049 [US2] Create game details page component in `src/app/(dashboard)/games/[id]/page.tsx`
- [x] T050 [US2] Implement pagination component with shadcn in `src/components/ui/pagination.tsx`
- [x] T051 [US2] Implement data table component with shadcn in `src/components/data-display/DataTable.tsx`
- [x] T052 [US2] Implement loading states for data fetching in `src/components/data-display/LoadingState.tsx`
- [x] T053 [US2] Create custom hook for player data fetching in `src/hooks/usePlayers.ts`
- [x] T054 [US2] Create custom hook for game data fetching in `src/hooks/useGames.ts`
- [x] T055 [US2] Implement filtering component for player list in `src/components/data-display/PlayerFilters.tsx`
- [x] T056 [US2] Implement filtering component for game list in `src/components/data-display/GameFilters.tsx`
- [x] T057 [US2] Add filtering API parameters to player list endpoint in `src/app/api/players/route.ts`
- [x] T058 [US2] Add filtering API parameters to game list endpoint in `src/app/api/games/route.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Data Management & Error Handling (Priority: P3)

**Goal**: System handles data inconsistencies and errors gracefully with proper logging and recovery

**Independent Test**: Introduce malformed data and verify system handles it appropriately with error logging and fallback behavior

### Tests for User Story 3 ⚠️

- [x] T059 [P] [US3] Integration test for error handling in parser in `tests/integration/parsers/errorHandling.test.ts`
- [x] T060 [P] [US3] Integration test for data validation errors in `tests/integration/sync/validationErrors.test.ts`
- [x] T061 [P] [US3] Integration test for partial data handling in `tests/integration/sync/partialData.test.ts`

### Implementation for User Story 3

- [x] T062 [US3] Implement data validation in sync job in `src/lib/jobs/syncJob.ts`
- [x] T063 [US3] Implement error recovery for failed records in `src/lib/jobs/syncJob.ts`
- [x] T064 [US3] Create error logging service in `src/lib/errorTracking/syncErrors.ts`
- [x] T065 [US3] Implement duplicate detection logic in `src/lib/db/deduplicate.ts`
- [x] T066 [US3] Implement data conflict resolution in `src/lib/db/resolveConflicts.ts`
- [x] T067 [US3] Add retry mechanism for failed sync operations in `src/lib/jobs/syncJob.ts`
- [x] T068 [US3] Implement sync status monitoring in `src/lib/monitoring/syncMonitor.ts`
- [x] T069 [US3] Create error notification system in `src/lib/notifications/syncNotifications.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Sync Status Management (Priority: P2)

**Goal**: Users can view sync status, manually trigger sync, and access sync logs through the web interface

**Independent Test**: Display sync status, manually trigger sync, and view sync logs in the web interface

### Tests for User Story 4 ⚠️

- [x] T070 [P] [US4] Integration test for sync status API in `tests/integration/api/syncStatus.test.ts`
- [x] T071 [P] [US4] Integration test for sync trigger API in `tests/integration/api/syncTrigger.test.ts`
- [x] T072 [P] [US4] Integration test for sync logs API in `tests/integration/api/syncLogs.test.ts`
- [x] T073 [P] [US4] E2E test for sync status page in `tests/e2e/sync-status.spec.ts`

### Implementation for User Story 4

- [x] T074 [US4] Create API route for sync status in `src/app/api/gomafia-sync/sync/status/route.ts`
- [x] T075 [US4] Create API route for sync trigger in `src/app/api/gomafia-sync/sync/trigger/route.ts`
- [x] T076 [US4] Create API route for sync logs in `src/app/api/gomafia-sync/sync/logs/route.ts`
- [x] T077 [US4] Create API route for sync log details in `src/app/api/gomafia-sync/sync/logs/[id]/route.ts`
- [x] T078 [US4] Create sync status page component in `src/app/(dashboard)/sync-status/page.tsx`
- [x] T079 [US4] Implement sync status indicator component in `src/components/data-display/SyncStatusIndicator.tsx`
- [x] T080 [US4] Implement sync trigger button component in `src/components/data-display/SyncTriggerButton.tsx`
- [x] T081 [US4] Implement sync logs table component in `src/components/data-display/SyncLogsTable.tsx`
- [x] T082 [US4] Create custom hook for sync status in `src/hooks/useSyncStatus.ts`
- [x] T083 [US4] Implement real-time sync status updates in `src/components/data-display/LiveSyncStatus.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T084 [P] Add database indexes for performance in `prisma/migrations/[timestamp]_add_sync_indexes/migration.sql`
- [x] T085 [P] Implement Redis caching for sync status in `src/lib/redis/syncCache.ts`
- [x] T086 [P] Add comprehensive error handling across all components
- [x] T087 [P] Implement rate limiting for sync operations in `src/lib/rateLimiter.ts`
- [x] T088 [P] Add monitoring and metrics collection in `src/lib/monitoring/metrics.ts`
- [x] T089 [P] Create comprehensive documentation in `docs/gomafia-sync.md`
- [ ] T090 [P] Update API documentation with sync endpoints
- [ ] T091 [P] Add unit tests for remaining utilities in `tests/unit/`
- [ ] T092 [P] Run end-to-end test suite validation
- [ ] T093 Run quickstart guide validation from `specs/002-gomafia-data-sync/quickstart.md`
- [ ] T094 [P] Performance optimization for batch processing
- [ ] T095 [P] Security audit for sync operations
- [ ] T096 [P] Accessibility audit for UI components
- [ ] T097 [P] Browser compatibility testing with Playwright
- [ ] T098 [P] **[DEFERRED - Future Enhancement]** Implement data export functionality (FR-015) in `src/lib/export/dataExporter.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Requires US1 data to display
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1 with error handling
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Requires US1 sync operations

### Within Each User Story

- Tests (REQUIRED) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for player parsing logic in tests/unit/parsers/gomafiaParser.test.ts"
Task: "Unit test for game parsing logic in tests/unit/parsers/gomafiaParser.test.ts"
Task: "Integration test for full sync workflow in tests/integration/sync/fullSync.test.ts"
Task: "Integration test for incremental sync workflow in tests/integration/sync/incrementalSync.test.ts"
Task: "Integration test for retry logic in tests/integration/sync/retryLogic.test.ts"

# Launch all database operations together:
Task: "Create SyncLog database operations in src/lib/db/syncLog.ts"
Task: "Create SyncStatus database operations in src/lib/db/syncStatus.ts"
Task: "Implement Player sync operations in src/lib/db/syncPlayer.ts"
Task: "Implement Game sync operations in src/lib/db/syncGame.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 4 → Test independently → Deploy/Demo
5. Add User Story 3 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Data Sync)
   - Developer B: User Story 2 (Data Display)
   - Developer C: User Story 4 (Sync Status)
3. After US1, US2, US4 complete:
   - All developers: User Story 3 (Error Handling)
4. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 98 tasks

- **Setup (Phase 1)**: 5 tasks
- **Foundational (Phase 2)**: 11 tasks
- **User Story 1 (Phase 3)**: 21 tasks (5 tests + 16 implementation)
- **User Story 2 (Phase 4)**: 21 tasks (4 tests + 17 implementation - includes 4 filtering tasks)
- **User Story 3 (Phase 5)**: 14 tasks (3 tests + 11 implementation)
- **User Story 4 (Phase 6)**: 14 tasks (4 tests + 10 implementation)
- **Polish (Phase 7)**: 15 tasks (includes 1 deferred export task)

**Parallel Opportunities**: 45+ tasks marked [P] can run in parallel

**MVP Scope**: Phases 1-3 (Setup + Foundational + User Story 1) = 37 tasks

**Independent Test Criteria**:

- US1: Successfully parse data from gomafia.pro, store in database, verify accessibility
- US2: Display player data, game records, and basic statistics in web interface
- US3: Handle malformed data gracefully with error logging and fallback behavior
- US4: Display sync status, manually trigger sync, and view sync logs in web interface

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are REQUIRED and MUST be written first before implementation
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
