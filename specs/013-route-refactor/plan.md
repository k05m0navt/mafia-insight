# Implementation Plan: Route and Database Refactoring

**Branch**: `013-route-refactor` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-route-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature refactors the application's routes, pages, and database schema to remove unused components, optimize performance, and improve code quality. The primary requirement is to analyze all routes, API endpoints, pages, and database tables to identify and remove/gate unused items, refactor incomplete implementations, and optimize database performance through index management and RLS policy improvements. Technical approach includes environment-based route gating, zero-downtime database migrations, code analysis tools for duplicate detection, and WCAG 2.1 Level AA compliance verification.

## Technical Context

**Language/Version**: TypeScript 5.0.0, Node.js 20+  
**Primary Dependencies**: Next.js 16.0.0, React 19.2.0, Prisma 5.0.0, Supabase 2.38.0, Playwright 1.56.1, Vitest 1.0.0  
**Storage**: PostgreSQL via Supabase, Prisma ORM  
**Testing**: Vitest (unit/integration), Playwright (E2E), Testing Library (component)  
**Target Platform**: Web (Next.js App Router), Vercel deployment  
**Project Type**: Web application (Next.js with App Router)  
**Performance Goals**: Database query performance improvement of 20% for common join operations, zero-downtime migrations  
**Constraints**: Must maintain backward compatibility, preserve E2E test functionality, follow Clean Architecture principles, WCAG 2.1 Level AA accessibility compliance  
**Scale/Scope**: ~50+ routes, ~30 pages, 20+ database tables, analysis of entire codebase for references

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Clean Architecture ✅

- **Status**: PASS
- **Rationale**: Refactoring maintains existing Clean Architecture structure. Route/page analysis and removal respects layer boundaries. Database migrations are isolated to data layer. No new architectural complexity introduced.
- **Implementation**: Analysis tools operate at appropriate layers (route handlers, page components, database schema). Refactoring preserves separation of concerns.

### Test-Driven Development ✅

- **Status**: PASS
- **Rationale**: All refactoring changes must have corresponding tests. E2E tests verify route/page functionality. Database migration tests verify schema changes. Code quality improvements must pass existing test suite.
- **Implementation**: Test coverage maintained at 80%+. E2E tests updated to reflect route changes. Migration rollback tests verify zero-downtime approach.

### Spec-Driven Development ✅

- **Status**: PASS
- **Rationale**: Comprehensive specification with 6 user stories, 14 functional requirements, and 14 measurable success criteria. All requirements are testable and independently verifiable.
- **Implementation**: Each user story maps to specific analysis and refactoring tasks. Success criteria provide clear definition of done.

### Modern Frontend Best Practices ✅

- **Status**: PASS
- **Rationale**: Refactored pages must meet WCAG 2.1 Level AA compliance. Code quality improvements (30% duplication reduction, 90% error handling coverage) align with modern standards. Environment-based routing follows Next.js best practices.
- **Implementation**: Accessibility verification tools, code analysis tools, environment variable checks.

### Package Management & Documentation ✅

- **Status**: PASS
- **Rationale**: Uses yarn exclusively. Documentation updates required for ROUTES.md and README.md. Context7 MCP and Supabase MCP used for research and implementation guidance.
- **Implementation**: Documentation updated incrementally. All dependencies managed via yarn.

### Code Quality & Standards ✅

- **Status**: PASS
- **Rationale**: Code quality metrics defined (30% duplication reduction, 90% error handling coverage). Linting and formatting checks maintained. Performance improvements measured (20% database query improvement).
- **Implementation**: Code analysis tools for duplication detection, error handling coverage measurement, performance benchmarking.

## Project Structure

### Documentation (this feature)

```text
specs/013-route-refactor/
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
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── admin/             # Admin-only pages
│   ├── api/               # API routes
│   │   ├── test-players/  # Test routes (to be gated)
│   │   ├── test-db/       # Test routes (to be gated)
│   │   └── users/         # User management APIs
│   └── globals.css
├── components/            # Reusable UI components
│   ├── ui/               # ShadCN/UI components
│   └── layout/           # Layout components
├── lib/                  # Utility functions and configurations
│   ├── db.ts            # Database connection
│   ├── validations.ts   # Zod schemas
│   └── utils.ts         # General utilities
├── hooks/               # Custom React hooks
├── store/               # Zustand state management
└── types/               # TypeScript type definitions

prisma/
├── schema.prisma       # Database schema (to be optimized)
└── migrations/         # Database migrations (zero-downtime)

docs/
├── technical/
│   └── ROUTES.md       # Route documentation (to be updated)
└── README.md           # Main documentation (to be updated)

tests/
├── components/         # Component tests
├── integration/       # Integration tests
├── e2e/               # End-to-end tests (Playwright)
└── utils/             # Test utilities
```

**Structure Decision**: Existing Next.js App Router structure maintained. Refactoring focuses on analysis and removal/gating of unused routes/pages, database optimization, and code quality improvements. No structural changes to architecture, only cleanup and optimization.

## Complexity Tracking

> **No complexity violations identified** - This is a refactoring feature that reduces complexity by removing unused code and optimizing existing implementations.

## Phase 0: Research Complete ✅

**Research Artifacts Generated**:

- `research.md` - Technical decisions and implementation patterns
- Route/page analysis methodology using static analysis and runtime checks
- Zero-downtime database migration techniques using PostgreSQL CONCURRENT indexes
- Code quality analysis tools (jscpd for duplication, custom scripts for error handling coverage)
- WCAG 2.1 Level AA compliance verification using axe-core and Lighthouse
- Environment-based route gating patterns for Next.js App Router
- Database table analysis and removal strategies
- RLS policy optimization patterns

**Key Decisions**:

1. **Route Gating**: Environment-based conditional routing (NODE_ENV checks) - preserves routes for development/testing
2. **Database Migrations**: Zero-downtime using CONCURRENT index creation - prevents service interruption
3. **Code Quality Tools**: jscpd for duplication (30% reduction target), custom scripts for error handling (90% coverage target)
4. **Accessibility**: axe-core + Lighthouse for WCAG 2.1 Level AA compliance verification
5. **Table Removal**: Multi-step analysis (code references → planned features → decision) before removal

## Phase 1: Design & Contracts Complete ✅

**Design Artifacts Generated**:

- `data-model.md` - Analysis entities (Route, Page, Database Table, Index) with state transitions
- `contracts/analysis-api.yaml` - OpenAPI specification for analysis and refactoring endpoints
- `quickstart.md` - Implementation guide with code examples and verification steps

**Key Design Decisions**:

1. **Analysis Entities**: Route, Page, Table, and Index entities with status tracking and decision workflows
2. **API Contracts**: Analysis endpoints for routes, pages, and database; refactoring application endpoint
3. **Migration Strategy**: Staged approach with rollback capabilities for all database changes
4. **Verification**: Automated testing and manual verification for all refactoring changes

## Phase 2: Task Decomposition

> **Note**: Task decomposition will be handled by `/speckit.tasks` command. This phase is not completed by `/speckit.plan`.

The following high-level work areas have been identified:

1. **Route Analysis & Gating**
   - Analyze all routes for usage
   - Gate test routes in production
   - Remove or complete incomplete routes

2. **Page Analysis & Refactoring**
   - Analyze all pages for usage and code quality
   - Remove or gate unused pages
   - Refactor pages to meet quality standards

3. **Database Optimization**
   - Analyze zero-row tables
   - Add missing foreign key indexes (zero-downtime)
   - Remove unused indexes
   - Optimize RLS policies

4. **Documentation Updates**
   - Update ROUTES.md
   - Update README.md
   - Update database schema documentation

5. **Testing & Verification**
   - Update E2E tests for route changes
   - Verify code quality improvements
   - Verify accessibility compliance
   - Verify database performance improvements
