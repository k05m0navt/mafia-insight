# Tasks: Fix Navbar UI and Authentication Errors

**Input**: Design documents from `/specs/010-fix-navbar-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks not explicitly requested in specification. TDD approach should be followed per constitution, but tests are implemented alongside each task rather than as separate tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project preparation and validation

- [x] T001 Verify Zustand store exists at src/store/authStore.ts and review current implementation
- [x] T002 Review existing authentication hooks (useAuth.ts, useSession.ts) to understand current state management
- [x] T003 [P] Review Navbar component at src/components/navigation/Navbar.tsx to identify current auth state usage
- [x] T004 [P] Review AuthControls component at src/components/navigation/AuthControls.tsx to identify current auth state usage

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Enhance checkAuthStatus in src/store/authStore.ts to properly sync with cookies on initialization (validate cookie first, sync Zustand store state)
- [x] T006 Update login action in src/store/authStore.ts to ensure store state updates immediately after successful authentication
- [x] T007 Update logout action in src/store/authStore.ts to clear state and synchronize with cookie clearing
- [x] T008 Create cookie utility function in src/lib/utils/auth.ts for reading auth-token cookie (if not exists)
- [x] T009 Add initialization logic in src/app/layout.tsx to call checkAuthStatus on mount and on navigation

**Checkpoint**: Foundation ready - Zustand store properly syncs with cookies, initialization on page load working

---

## Phase 3: User Story 1 - Authenticated User Sees Correct Navbar State (Priority: P1) 🎯 MVP

**Goal**: Navbar displays user icon/profile dropdown immediately after login instead of login/signup buttons

**Independent Test**: Login and verify navbar shows user icon/profile dropdown instead of login/signup buttons. Test navigation, page refresh, and cross-tab synchronization.

### Implementation for User Story 1

- [x] T010 [US1] Migrate Navbar component at src/components/navigation/Navbar.tsx to use Zustand selectors (useIsAuthenticated, useCurrentUser) instead of useAuth hook
- [x] T011 [US1] Migrate AuthControls component at src/components/navigation/AuthControls.tsx to use Zustand selectors instead of useAuth hook
- [x] T012 [US1] Update ProfileDropdown component at src/components/layout/ProfileDropdown.tsx to use Zustand selectors if it exists and uses auth state
- [x] T013 [US1] Ensure Navbar re-renders automatically when Zustand store state changes (verify React reactivity works)
- [x] T014 [US1] Test login flow: login → redirect → verify navbar shows user icon immediately
- [x] T015 [US1] Test navigation: authenticated user navigates between pages → verify navbar consistently shows user icon
- [x] T016 [US1] Test page refresh: authenticated user refreshes page → verify navbar shows user icon (state persists)
- [x] T017 [US1] Test logout: logout → verify navbar shows login/signup buttons immediately

**Checkpoint**: User Story 1 complete - Navbar correctly displays auth state after login, navigation, and page refresh

---

## Phase 4: User Story 2 - Import Page Handles Authentication Correctly (Priority: P1)

**Goal**: Import page loads and functions correctly for authenticated users without authentication errors

**Independent Test**: Access import page as authenticated user and verify no authentication errors appear. Test import progress viewing, starting/stopping imports.

### Implementation for User Story 2

- [x] T018 [US2] Fix authentication check in src/app/api/import/progress/route.ts GET handler to properly validate auth-token cookie
- [x] T019 [US2] Fix authentication check in src/app/api/import/progress/route.ts POST handler to properly validate auth-token cookie
- [x] T020 [US2] Fix authentication check in src/app/api/import/progress/route.ts PUT handler to properly validate auth-token cookie
- [x] T021 [US2] Fix authentication check in src/app/api/import/progress/route.ts DELETE handler to properly validate auth-token cookie
- [x] T022 [US2] Ensure import page component at src/app/admin/import/page.tsx properly handles auth state via Zustand (if it uses auth state)
- [x] T023 [US2] Ensure import page route is restricted to admin users only (redirect or deny access otherwise)
- [x] T024 [US2] Test import page access: authenticated user navigates to import page → verify page loads without errors
- [x] T025 [US2] Test import progress viewing: authenticated user views import progress → verify data displays correctly
- [x] T026 [US2] Test import operations: authenticated user starts/stops import → verify operations succeed without auth errors
- [x] T027 [US2] Test unauthorized access: non-authenticated user attempts import page → verify redirect to login or appropriate message

**Checkpoint**: User Story 2 complete - Import page works correctly for authenticated users, no auth errors

---

## Phase 5: User Story 3 - All Pages Handle Authentication State Consistently (Priority: P2)

**Goal**: All pages in application handle authentication correctly with no unexpected errors for authenticated users

**Independent Test**: Systematically check all pages as authenticated user and verify no unexpected authentication errors appear. Test API endpoints and actions on protected pages.

### Implementation for User Story 3

- [x] T028 [US3] Audit all API routes in src/app/api/ for consistent authentication cookie validation
- [x] T029 [US3] Fix any API routes with inconsistent auth token validation (standardize on auth-token cookie check)
- [x] T030 [US3] Audit all page components in src/app/ for auth state usage and migrate to Zustand if using useAuth hook
- [x] T031 [US3] Audit protected route middleware in src/proxy.ts to ensure consistent cookie validation
- [x] T032 [US3] Fix any pages showing UI state mismatches (showing wrong auth state in components)
- [x] T033 [US3] Fix any pages with failed API calls due to authentication issues
- [x] T034 [US3] Verify all protected pages load successfully for authenticated users (test each page systematically)
- [x] T035 [US3] Verify all API endpoints succeed for authenticated users (test API calls from protected pages)
- [x] T036 [US3] Test auth state changes: login/logout → navigate between pages → verify all pages reflect correct state
- [x] T037 [US3] Document findings and fixes in specs/010-fix-navbar-auth/AUDIT_RESULTS.md

**Checkpoint**: User Story 3 complete - All pages handle authentication consistently, comprehensive audit complete

---

## Phase 6: Session Expiry & Error Handling (Cross-Cutting)

**Purpose**: Handle session expiry gracefully and improve error handling across all pages

- [x] T038 Create session refresh API endpoint at src/app/api/auth/refresh/route.ts if it doesn't exist
- [x] T039 Implement session expiry detection in src/store/authStore.ts (add session expiry check to checkAuthStatus)
- [x] T040 Add toast notification component for session expiry in src/components/auth/SessionExpiredToast.tsx using @radix-ui/react-toast
- [x] T041 Integrate session expiry toast with refresh option in root layout or auth provider
- [x] T042 Add error handling for transient auth errors with toast notifications in src/components/auth/AuthErrorHandler.tsx
- [x] T043 Add inline error states for persistent auth errors in affected components
- [x] T044 Test session expiry flow: session expires → toast shown → refresh option → redirect if refresh fails
- [x] T045 Test cookie clearing: cookies cleared mid-session → verify UI updates to show unauthenticated state

---

## Phase 7: Cross-Tab Synchronization & Polish

**Purpose**: Ensure cross-tab sync works correctly and final polish

- [x] T046 Verify Zustand persist middleware cross-tab synchronization works (test login in one tab, verify other tabs update)
- [x] T047 Test cross-tab logout: logout in one tab → verify other tabs show login buttons
- [x] T048 Test cross-tab login: login in one tab → verify other tabs show user icon
- [x] T049 Ensure all components using auth state are migrated from useAuth hook to Zustand store (Navbar, AuthControls, ProfileDropdown migrated; legacy components remain for compatibility)
- [ ] T050 Run comprehensive test suite to verify all fixes work together (manual: run `yarn test:all`)
- [x] T051 Verify performance: authentication state updates reflected in navbar within 1 second (SC-004) - test created
- [x] T052 Update documentation in docs/auth/README.md with Zustand store usage patterns
- [x] T053 [P] Code cleanup: remove unused useAuth hook dependencies if no longer needed (legacy components kept for compatibility; new components use Zustand)
- [ ] T054 Run quickstart.md validation to ensure all steps work correctly (manual validation)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Stories 1 and 2 (both P1) can proceed in parallel if staffed
  - User Story 3 (P2) should start after US1 and US2 are complete (comprehensive audit)
- **Session Expiry & Error Handling (Phase 6)**: Can start after Foundational, but benefits from all user stories complete
- **Cross-Tab Sync & Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Can run in parallel with US1 (different components)
- **User Story 3 (P2)**: Should start after US1 and US2 complete - Comprehensive audit requires stable baseline

### Within Each User Story

- Store enhancements before component migrations
- Component migrations before integration testing
- Core implementation before edge case handling
- Story complete before moving to next priority

### Parallel Opportunities

- Setup tasks T003-T004 can run in parallel (review different components)
- User Stories 1 and 2 (both P1) can run in parallel after Foundational phase:
  - US1: Navbar/AuthControls migration
  - US2: Import page API fixes
- API route fixes in US2 (T018-T021) can run in parallel (different HTTP methods)
- Audit tasks in US3 (T028-T033) can be done in parallel for different sections
- Phase 7 tasks T053 can run in parallel with testing tasks

---

## Parallel Example: User Story 1

```bash
# Components can be migrated in parallel:
Task T010: "Migrate Navbar component to use Zustand selectors"
Task T011: "Migrate AuthControls component to use Zustand selectors"
Task T012: "Update ProfileDropdown component to use Zustand selectors"

# Tests can run after migrations complete:
Task T014: "Test login flow"
Task T015: "Test navigation"
Task T016: "Test page refresh"
```

---

## Parallel Example: User Story 2

```bash
# API route fixes can be done in parallel:
Task T018: "Fix GET handler authentication check"
Task T019: "Fix POST handler authentication check"
Task T020: "Fix PUT handler authentication check"
Task T021: "Fix DELETE handler authentication check"

# Page component updates:
Task T022: "Ensure import page component uses Zustand"
Task T023: "Ensure import page uses Zustand"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (review existing code)
2. Complete Phase 2: Foundational (enhance Zustand store, add initialization)
3. Complete Phase 3: User Story 1 (migrate Navbar/AuthControls to Zustand)
4. **STOP and VALIDATE**: Test User Story 1 independently - login and verify navbar updates correctly
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - Navbar fixes!)
3. Add User Story 2 → Test independently → Deploy/Demo (Import page fixes)
4. Add User Story 3 → Test independently → Deploy/Demo (Comprehensive audit)
5. Add Session Expiry handling → Polish → Final deployment
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Navbar migration)
   - Developer B: User Story 2 (Import page API fixes)
3. After US1 and US2 complete:
   - Developer A + B: User Story 3 (Comprehensive audit - divide pages/APIs)
4. Together: Session expiry, cross-tab sync, polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- TDD: Write tests as you implement each task (tests not separate tasks per spec guidance)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Zustand persist middleware handles cross-tab sync automatically - no manual StorageEvent listeners needed
- Cookie is source of truth for SSR/API, Zustand store for client-side state
