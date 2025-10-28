# Implementation Plan: Browser Testing and Authentication UX Improvements

**Branch**: `006-browser-testing-auth` | **Date**: 2025-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-browser-testing-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement comprehensive Playwright testing coverage and improve authentication UX with role-based navigation, theme controls, and real-time UI updates. The feature addresses testing gaps, navigation inconsistencies, and user experience issues across the Mafia Insight application.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 14.x, React 18.x  
**Primary Dependencies**: Playwright, Next.js, React, Tailwind CSS, Prisma, Supabase  
**Storage**: PostgreSQL (via Prisma), Supabase Auth, localStorage (theme preferences)  
**Testing**: Playwright (E2E), Vitest (unit/integration), React Testing Library  
**Target Platform**: Web browsers (Chrome, Firefox, Safari), Node.js server  
**Project Type**: Web application (Next.js full-stack)  
**Performance Goals**: <500ms theme switching, <1s navigation updates, <30s auth completion  
**Constraints**: Real-time updates without page refresh, cross-browser compatibility, 80%+ test coverage  
**Scale/Scope**: Multi-role user system, comprehensive E2E testing, responsive navigation

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Clean Architecture Compliance ✅

- **Use Cases**: Authentication, navigation, theme management, permission control
- **Entities**: User Role, Page Permission, Theme Preference, Navigation State
- **Dependency Inversion**: UI components depend on use cases, not frameworks
- **Separation of Concerns**: Clear boundaries between auth, navigation, and testing layers
- **Design Phase**: Data model and API contracts maintain clean separation

### Test-Driven Development ✅

- **Playwright Tests**: Comprehensive E2E coverage for all user flows
- **Unit Tests**: Component and service testing with React Testing Library
- **Integration Tests**: API contract testing and role-based access validation
- **Coverage Target**: 80%+ maintained across all new code
- **Design Phase**: Test structure defined with fixtures and page objects

### Spec-Driven Development ✅

- **User Stories**: 9 prioritized, independently testable stories
- **Acceptance Criteria**: Clear, measurable criteria for each story
- **Success Criteria**: 10 measurable outcomes defined
- **Edge Cases**: 5 critical edge cases identified and addressed
- **Design Phase**: All requirements mapped to concrete implementations

### Modern Frontend Best Practices ✅

- **Component Architecture**: Reusable, accessible navigation components
- **State Management**: Predictable theme and auth state management
- **Performance**: Real-time updates without page refresh
- **Accessibility**: WCAG 2.1 AA compliance for navigation and auth flows
- **Design Phase**: Component structure and hooks defined

### Package Management & Documentation ✅

- **Yarn Usage**: Exclusive yarn package management
- **Context7 Integration**: Up-to-date documentation access
- **Dependency Documentation**: Clear rationale for all new dependencies
- **Design Phase**: No new dependencies required, using existing stack

### Code Quality & Standards ✅

- **Linting**: ESLint and Prettier compliance
- **Architecture Reviews**: Clean Architecture compliance verification
- **Performance**: Measurable targets defined and tracked
- **Design Phase**: All technical decisions align with quality standards

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── signup/
│   ├── admin/                    # Admin-only pages
│   │   └── permissions/
│   ├── players/                  # Player management
│   ├── analytics/                # Analytics dashboard
│   └── globals.css
├── components/                   # Reusable UI components
│   ├── auth/                     # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── AuthProvider.tsx
│   ├── navigation/               # Navigation components
│   │   ├── Navbar.tsx
│   │   ├── NavItem.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── AuthControls.tsx
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── ErrorBoundary.tsx
│   └── protected/                # Permission-based components
│       ├── ProtectedRoute.tsx
│       └── ProtectedComponent.tsx
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useTheme.ts
│   ├── usePermissions.ts
│   └── useNavigation.ts
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication utilities
│   ├── permissions.ts            # Permission management
│   ├── theme.ts                  # Theme utilities
│   └── errors.ts                 # Error handling
├── services/                     # API services
│   ├── authService.ts
│   ├── navigationService.ts
│   └── permissionService.ts
├── types/                        # TypeScript type definitions
│   ├── auth.ts
│   ├── navigation.ts
│   └── permissions.ts
└── store/                        # State management
    └── authStore.ts

tests/
├── e2e/                          # Playwright E2E tests
│   ├── auth/                     # Authentication tests
│   │   ├── login.spec.ts
│   │   ├── signup.spec.ts
│   │   └── logout.spec.ts
│   ├── navigation/               # Navigation tests
│   │   ├── navbar.spec.ts
│   │   ├── permissions.spec.ts
│   │   └── theme.spec.ts
│   ├── admin/                    # Admin functionality tests
│   │   └── permissions.spec.ts
│   └── fixtures/                 # Test fixtures
│       ├── auth.ts
│       └── users.ts
├── integration/                  # Integration tests
│   ├── auth.test.ts
│   ├── navigation.test.ts
│   └── permissions.test.ts
├── unit/                         # Unit tests
│   ├── components/
│   ├── hooks/
│   └── services/
└── __mocks__/                    # Test mocks
    ├── next-auth.ts
    └── localStorage.ts
```

**Structure Decision**: Single Next.js application with clear separation of concerns. Components are organized by feature (auth, navigation, ui) with dedicated directories for hooks, services, and types. Testing structure mirrors the source code organization with separate directories for E2E, integration, and unit tests.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
