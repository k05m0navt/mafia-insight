# Tasks: Admin Dashboard & Import Controls

**Input**: Design documents from `/specs/011-admin-dashboard/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are INCLUDED per constitution requirement for TDD approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and validation of existing infrastructure

- [ ] T001 Verify existing admin infrastructure in src/app/(admin)/ and src/components/admin/
- [ ] T002 Verify existing import orchestrator supports AbortSignal in src/lib/gomafia/import/import-orchestrator.ts
- [ ] T003 Verify existing Prisma schema includes required tables (SyncStatus, SyncLog, ImportCheckpoint, etc.)
- [ ] T004 Verify existing advisory lock infrastructure in src/lib/gomafia/import/advisory-lock.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create admin directory structure in src/lib/admin/
- [ ] T006 [P] Create dashboard service interface in src/lib/admin/dashboard-service.ts
- [ ] T007 [P] Create import control service interface in src/lib/admin/import-control-service.ts
- [ ] T008 [P] Create database clear service interface in src/lib/admin/database-clear-service.ts
- [ ] T009 [P] Create useAdminDashboard hook in src/hooks/useAdminDashboard.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Comprehensive Admin Dashboard (Priority: P1) 🎯 MVP

**Goal**: Display system health metrics, import status, data volume, recent activity, and quick actions for administrators.

**Independent Test**: Can be fully tested by logging in as an admin, accessing the dashboard, and verifying that all key metrics, system status indicators, and quick actions are displayed correctly and respond to user interactions.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Unit test for dashboard service in tests/unit/lib/admin/dashboard-service.test.ts
- [ ] T011 [P] [US1] Integration test for dashboard API in tests/integration/api/admin/dashboard.test.ts
- [ ] T012 [P] [US1] Component test for DashboardMetrics in tests/unit/components/admin/DashboardMetrics.test.tsx
- [ ] T013 [P] [US1] E2E test for dashboard browsing in tests/e2e/admin/dashboard.spec.ts

### Implementation for User Story 1

- [ ] T014 [US1] Implement dashboard metrics calculation in src/lib/admin/dashboard-service.ts
- [ ] T015 [US1] Create DashboardMetrics component in src/components/admin/DashboardMetrics.tsx
- [ ] T016 [US1] Create RecentActivity component in src/components/admin/RecentActivity.tsx
- [ ] T017 [US1] Create SystemHealthBadge component in src/components/admin/SystemHealthBadge.tsx
- [ ] T018 [US1] Create QuickActions component in src/components/admin/QuickActions.tsx
- [ ] T019 [US1] Implement dashboard API route in src/app/api/admin/dashboard/route.ts
- [ ] T020 [US1] Enhance admin dashboard page in src/app/(admin)/page.tsx with new components
- [ ] T021 [US1] Implement useAdminDashboard hook with TanStack Query polling in src/hooks/useAdminDashboard.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Import Cancellation (Priority: P1)

**Goal**: Enable administrators to safely stop running import operations with graceful shutdown and checkpoint preservation.

**Independent Test**: Can be fully tested by starting an import, clicking the stop button, and verifying that the import terminates gracefully, locks are released, partial data is saved or rolled back appropriately, and the system status updates reflect the cancellation.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T022 [P] [US2] Unit test for import control service in tests/unit/lib/admin/import-control-service.test.ts
- [ ] T023 [P] [US2] Unit test for orchestrator cancellation in tests/unit/lib/gomafia/import/orchestrator.test.ts
- [ ] T024 [P] [US2] Integration test for stop import API in tests/integration/api/admin/stop-import.test.ts
- [ ] T025 [P] [US2] E2E test for import cancellation workflow in tests/e2e/admin/import-cancellation.spec.ts

### Implementation for User Story 2

- [ ] T026 [US2] Verify AbortSignal support in ImportOrchestrator in src/lib/gomafia/import/import-orchestrator.ts
- [ ] T027 [US2] Implement cancelImport logic in src/lib/admin/import-control-service.ts
- [ ] T028 [US2] Create ImportControls component with stop button in src/components/admin/ImportControls.tsx
- [ ] T029 [US2] Implement stop import API route in src/app/api/admin/import/stop/route.ts
- [ ] T030 [US2] Add ImportControls to admin dashboard in src/app/(admin)/page.tsx
- [ ] T031 [US2] Enhance import orchestrator with checkpoint saving before termination in src/lib/gomafia/import/import-orchestrator.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Database Clear for Fresh Import (Priority: P1)

**Goal**: Enable administrators to clear all imported game data while preserving user accounts and system configuration.

**Independent Test**: Can be fully tested by confirming the clear action, verifying the database is emptied, attempting to trigger a fresh import, and confirming all data is re-imported successfully from scratch.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T032 [P] [US3] Unit test for database clear service in tests/unit/lib/admin/database-clear-service.test.ts
- [ ] T033 [P] [US3] Integration test for database clear API with transaction rollback in tests/integration/api/admin/clear-db.test.ts
- [ ] T034 [P] [US3] E2E test for database clear workflow in tests/e2e/admin/database-clear.spec.ts

### Implementation for User Story 3

- [ ] T035 [US3] Implement clearDatabase with Prisma transaction in src/lib/admin/database-clear-service.ts
- [ ] T036 [US3] Add clear database functionality to ImportControls component in src/components/admin/ImportControls.tsx
- [ ] T037 [US3] Implement clear database API route in src/app/api/admin/import/clear-db/route.ts
- [ ] T038 [US3] Add database clear validation to prevent during active imports in src/lib/admin/database-clear-service.ts

**Checkpoint**: All P1 user stories should now be independently functional

---

## Phase 6: User Story 4 - Professional Dark Theme (Priority: P2)

**Goal**: Apply modern dark theme design following WCAG AA standards with professional appearance.

**Independent Test**: Can be fully tested by enabling dark mode, navigating through all major pages and components, and verifying that text is readable, contrast ratios meet accessibility standards, interactive elements are clearly visible, and the overall appearance is polished and professional.

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T039 [P] [US4] Accessibility test for dark theme contrast in tests/a11y/dark-theme-contrast.test.ts
- [ ] T040 [P] [US4] Component test for theme switching in tests/unit/components/ui/theme-toggle.test.tsx
- [ ] T041 [P] [US4] E2E test for theme switching and validation in tests/e2e/admin/dark-theme.spec.ts

### Implementation for User Story 4

- [ ] T042 [US4] Audit current dark theme CSS in src/app/globals.css
- [ ] T043 [US4] Update dark theme CSS custom properties for WCAG AA compliance in src/app/globals.css
- [ ] T044 [US4] Adjust role-based colors for dark mode in src/app/globals.css
- [ ] T045 [US4] Test all components in dark mode and fix contrast issues in src/components/
- [ ] T046 [US4] Verify charts render correctly in dark mode with visible axes and legends
- [ ] T047 [US4] Ensure smooth theme transitions without flickering in src/components/providers/ThemeProvider.tsx

**Checkpoint**: All user stories should now be independently functional with enhanced dark theme

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T048 [P] Update admin API documentation in docs/api/admin.md
- [ ] T049 [P] Add comprehensive error handling across all admin endpoints
- [ ] T050 [P] Performance optimization for dashboard metrics aggregation
- [ ] T051 [P] Security hardening for admin operations (audit logging, rate limiting)
- [ ] T052 [P] Accessibility improvements across all admin components
- [ ] T053 Run quickstart.md validation and update as needed
- [ ] T054 [P] Code cleanup and refactoring in src/lib/admin/
- [ ] T055 [P] Integration test for complete admin workflows in tests/integration/workflows/admin-operations.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Admin Dashboard)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1 - Import Cancellation)**: Can start after Foundational (Phase 2) - Independent from US1
- **User Story 3 (P1 - Database Clear)**: Can start after Foundational (Phase 2) - Independent from US1/US2
- **User Story 4 (P2 - Dark Theme)**: Can start after Foundational (Phase 2) - Independent from other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Services before components
- Components before API routes
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T004) can verify existing infrastructure in parallel
- Foundational tasks (T006-T009) marked [P] can run in parallel
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Services and components marked [P] within a story can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for dashboard service in tests/unit/lib/admin/dashboard-service.test.ts"
Task: "Integration test for dashboard API in tests/integration/api/admin/dashboard.test.ts"
Task: "Component test for DashboardMetrics in tests/unit/components/admin/DashboardMetrics.test.tsx"
Task: "E2E test for dashboard browsing in tests/e2e/admin/dashboard.spec.ts"

# Launch all components for User Story 1 together (after service):
Task: "Create DashboardMetrics component in src/components/admin/DashboardMetrics.tsx"
Task: "Create RecentActivity component in src/components/admin/RecentActivity.tsx"
Task: "Create SystemHealthBadge component in src/components/admin/SystemHealthBadge.tsx"
Task: "Create QuickActions component in src/components/admin/QuickActions.tsx"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Unit test for import control service in tests/unit/lib/admin/import-control-service.test.ts"
Task: "Unit test for orchestrator cancellation in tests/unit/lib/gomafia/import/orchestrator.test.ts"
Task: "Integration test for stop import API in tests/integration/api/admin/stop-import.test.ts"
Task: "E2E test for import cancellation workflow in tests/e2e/admin/import-cancellation.spec.ts"

# Launch service and component in parallel (after tests):
Task: "Implement cancelImport logic in src/lib/admin/import-control-service.ts"
Task: "Create ImportControls component with stop button in src/components/admin/ImportControls.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 Only - All P1)

1. Complete Phase 1: Setup (verify existing infrastructure)
2. Complete Phase 2: Foundational (service interfaces and hooks)
3. Complete Phase 3: User Story 1 (Admin Dashboard)
4. Complete Phase 4: User Story 2 (Import Cancellation)
5. Complete Phase 5: User Story 3 (Database Clear)
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP part 1)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP part 2)
4. Add User Story 3 → Test independently → Deploy/Demo (Complete MVP!)
5. Add User Story 4 → Test independently → Deploy/Demo (Enhanced UX)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Dashboard)
   - Developer B: User Story 2 (Import Cancellation) OR User Story 3 (Database Clear)
   - Developer C: User Story 4 (Dark Theme)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [US1-US4] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All existing infrastructure is in place - this feature extends it
- No new database migrations required - using existing tables
- TDD approach required per constitution
