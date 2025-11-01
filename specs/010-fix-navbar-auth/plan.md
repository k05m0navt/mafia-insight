# Implementation Plan: Fix Navbar UI and Authentication Errors

**Branch**: `010-fix-navbar-auth` | **Date**: 2025-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-fix-navbar-auth/spec.md`

## Summary

Fix critical authentication state synchronization issues where the navbar displays incorrect UI (showing login/signup buttons instead of user icon after authentication) and authentication errors on protected pages. Implement comprehensive authentication state synchronization across all UI components, fix import page authentication errors, and audit all pages for consistent authentication handling.

**Technical Approach**: Migrate components to use existing Zustand auth store (`src/store/authStore.ts`) instead of `useAuth` hook. Zustand's persist middleware automatically handles cross-tab synchronization, localStorage persistence, and React reactivity. Fix navbar `AuthControls` component to use Zustand selectors, ensure proper initialization on page load/navigation via `checkAuthStatus`, and fix authentication error handling throughout the application.

## Technical Context

**Language/Version**: TypeScript 5.0+  
**Primary Dependencies**: Next.js 16.0, React 19.2, @supabase/supabase-js 2.38.0, @supabase/ssr 0.1.0, next-auth 4.24.12  
**Storage**: Supabase (PostgreSQL), Cookie-based session storage (auth-token cookie)  
**Testing**: Vitest 1.0, Playwright 1.56, @testing-library/react 16.0  
**Target Platform**: Web application (Next.js SSR/SSG)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Authentication state updates reflected in UI within 1 second (SC-004), zero authentication-related performance degradation  
**Constraints**: Must maintain backward compatibility with existing authentication system, must not break existing protected routes  
**Scale/Scope**: All application pages (comprehensive audit per FR-005), all authenticated users

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Core Principles Compliance

✅ **Clean Architecture**: Changes will enhance existing authentication layer without introducing architectural violations. State synchronization logic belongs in hooks layer, UI components consume hooks.

✅ **Test-Driven Development**: All fixes MUST be covered by tests:

- Unit tests for `useAuth` hook state synchronization
- Component tests for `Navbar` and `AuthControls` state rendering
- Integration tests for authentication flow across pages
- E2E tests for complete login → navbar update → page navigation flow

✅ **Spec-Driven Development**: Feature fully specified with user stories, acceptance criteria, and success criteria. Implementation follows spec requirements.

✅ **Modern Frontend Best Practices**: Using existing React hooks pattern, maintaining component reusability, following established patterns.

✅ **Package Management**: Using yarn exclusively (as per package.json and constitution).

✅ **Code Quality**: All code must pass linting, maintain 80%+ test coverage for new/modified code.

### Quality Gates

✅ All tests MUST pass before merge  
✅ Architecture compliance verified (hooks pattern, component structure)  
✅ Performance requirement met (1 second state update - SC-004)  
✅ Security maintained (no auth bypass vulnerabilities introduced)

## Project Structure

### Documentation (this feature)

```text
specs/010-fix-navbar-auth/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router pages
│   ├── (admin)/import/           # Import page (has auth errors - FR-003)
│   ├── (dashboard)/              # Protected dashboard routes
│   └── api/                      # API routes with auth checks
├── components/
│   ├── navigation/
│   │   ├── Navbar.tsx            # Main navbar (FR-001, FR-002)
│   │   └── AuthControls.tsx     # Auth UI controls (FR-001, FR-002)
│   └── auth/                     # Auth components
├── hooks/
│   ├── useAuth.ts                # Primary auth hook (FR-002, FR-006, FR-008)
│   ├── useSession.ts             # Session management (FR-008)
│   └── usePermissions.ts         # Permission checks
├── lib/
│   ├── auth/                     # Auth utilities
│   ├── apiAuth.ts                # API authentication middleware
│   └── errors.ts                 # Error handling
└── services/
    └── AuthService.ts             # Auth service layer

tests/
├── unit/
│   └── hooks/
│       └── useAuth.test.ts       # Auth hook tests
├── components/
│   └── navigation/
│       └── Navbar.test.tsx       # Navbar component tests
├── integration/
│   └── auth/
│       └── auth-flow.test.ts    # Full auth flow tests
└── e2e/
    └── auth/
        └── navbar-auth.spec.ts   # E2E navbar auth tests
```

**Structure Decision**: Single Next.js web application. Changes primarily in:

- Zustand store (`src/store/authStore.ts`) - enhance `checkAuthStatus` for cookie sync
- Navigation components (`Navbar`, `AuthControls`) - migrate to use Zustand selectors
- Page components - ensure proper store initialization
- Test structure mirrors source structure

## Constitution Check (Post-Design)

_Re-checked after Phase 1 design completion_

### Core Principles Compliance

✅ **Clean Architecture**: Design maintains separation of concerns:

- Hooks layer (`useAuth`) handles state management
- Components consume hooks (no direct service access)
- Services handle API/authentication logic
- No architectural violations introduced

✅ **Test-Driven Development**: Test strategy defined:

- Unit tests for `useAuth` hook
- Component tests for Navbar/AuthControls
- Integration tests for auth flow
- E2E tests for complete user journey
- All test requirements specified in quickstart.md

✅ **Spec-Driven Development**: Implementation follows spec:

- All functional requirements addressed in design
- User stories mapped to implementation approach
- Success criteria measurable and testable

✅ **Modern Frontend Best Practices**:

- Using React hooks pattern (existing)
- Event-driven state synchronization (scalable)
- Component reusability maintained
- Accessibility preserved (WCAG 2.1 AA)

✅ **Package Management**: Using yarn exclusively (no changes)

✅ **Code Quality**:

- Linting requirements maintained
- Test coverage requirements specified
- Error handling patterns defined

### Quality Gates (Post-Design)

✅ All design decisions align with test requirements  
✅ Architecture maintains Clean Architecture principles  
✅ Performance requirement (1 second) achievable with event-driven pattern  
✅ Security maintained (cookie-based auth, no vulnerabilities introduced)  
✅ No additional complexity beyond necessary fixes

## Complexity Tracking

> **No constitutional violations identified. All changes follow existing patterns and architecture.**
