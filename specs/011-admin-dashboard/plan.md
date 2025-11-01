# Implementation Plan: Admin Dashboard & Import Controls

**Branch**: `011-admin-dashboard` | **Date**: January 27, 2025 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/011-admin-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a comprehensive admin dashboard with centralized system health monitoring, import control capabilities, database management, and enhanced dark theme. The feature encompasses:

1. **Admin Dashboard** - Centralized interface displaying system health metrics, import status, data volume, recent activity, and quick actions
2. **Import Cancellation** - Safe termination of running import operations with graceful shutdown and checkpoint preservation
3. **Database Clear** - Complete reset of imported game data while preserving user accounts and system configuration
4. **Dark Theme Enhancement** - Modern dark mode implementation following WCAG AA standards with professional design

**Technical Approach**: Build upon existing Next.js 16 App Router with admin infrastructure, enhance existing import orchestrator with cancellation support, implement database clear operations using Prisma transactions, and refine Tailwind CSS dark theme using modern best practices.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16 (App Router), Node.js 20+  
**Primary Dependencies**: Next.js, React 19, Prisma ORM, Tailwind CSS, ShadCN/UI, TanStack Query, Zustand  
**Storage**: PostgreSQL (Supabase) with Prisma ORM  
**Testing**: Vitest for unit/integration tests, Playwright for E2E browser tests  
**Target Platform**: Vercel Edge Runtime, modern web browsers (Chrome, Firefox, Safari, Edge - last 2 versions)  
**Project Type**: Web application (Next.js full-stack)  
**Performance Goals**:

- Dashboard page load < 3 seconds
- Import cancellation response < 10 seconds
- Database clear operation < 2 minutes for typical sizes
- Theme switching < 500ms without flickering
- Real-time dashboard updates within 5 seconds

**Constraints**:

- Must preserve all User accounts during database clear
- Must maintain audit logs (SyncLog, SyncStatus, ImportCheckpoint, etc.)
- Must prevent database clear during active imports
- Must release all advisory locks on import cancellation
- Dark theme must meet WCAG AA contrast ratios (4.5:1 normal, 3:1 large text)
- 100% accuracy for dashboard metrics

**Scale/Scope**:

- 4 user stories with 32 functional requirements
- 18 success criteria to meet
- Admin dashboard serving ~10-100 administrators
- Import operations managing 10,000+ players and 50,000+ games
- Database clear operations on production-scale datasets

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Clean Architecture (NON-NEGOTIABLE)

✅ **PASS** - Feature builds on existing Next.js App Router architecture:

- **Presentation**: React components in `src/components/`, pages in `src/app/(admin)/`
- **Application**: API routes in `src/app/api/admin/`, hooks in `src/hooks/`
- **Domain**: Business logic in `src/lib/`, services in `src/services/`
- **Infrastructure**: Database access via Prisma, external integrations isolated

No architectural violations. Admin dashboard, import controls, and theme enhancements align with existing clean architecture layers.

### II. Test-Driven Development (NON-NEGOTIABLE)

⚠️ **REQUIRES ATTENTION** - Must follow TDD for all new functionality:

- **Requirements**: Write tests before implementation for all new features
- **Coverage**: Maintain minimum 80% test coverage
- **Tests Needed**:
  - Unit tests for admin dashboard components and metrics calculation
  - Integration tests for import cancellation and database clear operations
  - E2E tests for complete admin workflows
  - Accessibility tests for dark theme contrast ratios

**Justification**: All new code must be test-driven per constitution. Import cancellation and database clear are critical operations requiring comprehensive test coverage to prevent data loss or corruption.

### III. Spec-Driven Development

✅ **PASS** - Comprehensive specification completed:

- 4 prioritized user stories (P1-P2) with independent value
- 32 functional requirements with clear acceptance criteria
- 8 edge cases identified and addressed
- 18 measurable success criteria
- All clarifications documented (1 clarification resolved)

### IV. Modern Frontend Best Practices

✅ **PASS** - Leveraging modern React patterns:

- Server Components and Client Components (Next.js App Router)
- ShadCN/UI for accessible, reusable components
- TanStack Query for server state management
- Zustand for client state management
- WCAG 2.1 AA accessibility compliance for dark theme

### V. Package Management & Documentation

✅ **PASS** - Using Yarn exclusively per user rules

- All package operations use yarn
- Documentation accessible via Context7 MCP when needed

### VI. Code Quality & Standards

✅ **PASS** - All code must pass linting and formatting

- ESLint for code quality
- Prettier for code formatting
- TypeScript for type safety
- Complexity justified through architecture

## Project Structure

### Documentation (this feature)

```text
specs/011-admin-dashboard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── admin-api.yaml   # Admin dashboard and import control APIs
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (admin)/
│   │   ├── page.tsx                    # Enhanced admin dashboard with metrics
│   │   ├── import-controls/
│   │   │   └── page.tsx                # Import controls with stop/clear buttons
│   │   └── layout.tsx                  # Existing admin layout
│   └── api/
│       ├── admin/
│       │   ├── dashboard/
│       │   │   └── route.ts            # Dashboard metrics API
│       │   ├── import/
│       │   │   ├── stop/
│       │   │   │   └── route.ts        # Import cancellation API
│       │   │   └── clear-db/
│       │   │       └── route.ts        # Database clear API
│       │   └── health/
│       │       └── route.ts            # System health check API
│       └── gomafia-sync/
│           └── import/
│               └── route.ts            # Enhanced with cancellation support
├── components/
│   ├── admin/
│   │   ├── DashboardMetrics.tsx        # System health and data metrics
│   │   ├── RecentActivity.tsx          # Activity feed component
│   │   ├── SystemHealthBadge.tsx       # Health status indicator
│   │   ├── ImportControls.tsx          # Stop import and clear DB UI
│   │   └── QuickActions.tsx            # Quick action cards
│   ├── ui/
│   │   └── [existing ShadCN components with dark theme enhancements]
│   └── providers/
│       └── ThemeProvider.tsx           # Enhanced theme provider
├── lib/
│   ├── admin/
│   │   ├── dashboard-service.ts        # Dashboard metrics calculation
│   │   ├── import-control-service.ts   # Import cancellation logic
│   │   └── database-clear-service.ts   # Database clear operations
│   ├── gomafia/
│   │   └── import/
│   │       ├── import-orchestrator.ts  # Enhanced with cancellation
│   │       └── advisory-lock.ts        # Advisory lock management
│   └── db.ts                           # Prisma client with transaction support
├── services/
│   └── validation-service.ts           # Data validation utilities
├── hooks/
│   ├── useAdminDashboard.ts            # Admin dashboard data fetching
│   └── useTheme.ts                     # Enhanced theme management
└── styles/
    └── globals.css                     # Enhanced dark theme CSS variables

tests/
├── unit/
│   ├── lib/
│   │   ├── admin/
│   │   │   ├── dashboard-service.test.ts
│   │   │   ├── import-control-service.test.ts
│   │   │   └── database-clear-service.test.ts
│   │   └── gomafia/
│   │       └── import/
│   │           └── import-orchestrator.test.ts
│   └── components/
│       └── admin/
│           ├── DashboardMetrics.test.tsx
│           ├── RecentActivity.test.tsx
│           └── ImportControls.test.tsx
├── integration/
│   ├── api/
│   │   └── admin/
│   │       ├── dashboard.test.ts
│   │       ├── stop-import.test.ts
│   │       └── clear-db.test.ts
│   └── workflows/
│       └── admin-operations.test.ts    # End-to-end admin workflows
├── e2e/
│   └── admin/
│       ├── dashboard.spec.ts           # Dashboard browsing
│       ├── import-cancellation.spec.ts # Import stop workflow
│       ├── database-clear.spec.ts      # Database clear workflow
│       └── dark-theme.spec.ts          # Theme switching and validation
└── a11y/
    └── dark-theme-contrast.test.ts     # WCAG AA compliance tests
```

**Structure Decision**: Single Next.js web application. Admin features extend existing `src/app/(admin)` pages and `src/components/admin` components. New services in `src/lib/admin` for business logic separation. API routes follow RESTful patterns in `src/app/api/admin`. Tests organized by type in `tests/` directory with admin-specific test suites.

## Complexity Tracking

_No violations requiring justification - feature aligns with existing architecture patterns._
