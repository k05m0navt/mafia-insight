# Implementation Plan: First Production Release Preparation

**Branch**: `009-first-release-prep` | **Date**: October 30, 2025 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/009-first-release-prep/spec.md`

## Summary

Prepare the Mafia Insight application for its first production release on Vercel by addressing critical user experience issues, ensuring data completeness and accuracy, implementing automated synchronization, and cleaning up the codebase. The feature encompasses:

1. **Authentication UX** - Complete login feedback, profile UI in navbar, dedicated profile page, admin bootstrapping
2. **Data Verification** - Ensure complete import from gomafia.pro, verify accuracy, implement 24-hour auto-sync with Vercel Cron
3. **Data Display Fixes** - Resolve issues with games, players, tournaments rendering
4. **Codebase Quality** - Remove unused files, update documentation, ensure Vercel deployment readiness
5. **Testing** - Achieve 90% test pass rate through fixing broken tests and adding comprehensive coverage

**Technical Approach**: Leverage existing Next.js 14 App Router architecture with Supabase for authentication/storage, Vercel Cron for scheduled tasks, and comprehensive testing strategy balancing infrastructure fixes with new test coverage.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router), Node.js 20+  
**Primary Dependencies**: Next.js, React 19, Prisma ORM, Supabase (Auth & Storage), TanStack Query, Zustand, ShadCN/UI, Playwright, Vitest  
**Storage**: PostgreSQL (Supabase) for primary database, Supabase Storage for user avatars  
**Testing**: Vitest for unit/integration tests, Playwright for E2E browser tests  
**Target Platform**: Vercel Edge Runtime, modern web browsers (Chrome, Firefox, Safari, Edge - last 2 versions)  
**Project Type**: Web application (Next.js full-stack)  
**Performance Goals**:

- Page load times < 3 seconds
- Login feedback < 1 second
- Profile page access < 3 clicks
- Data sync completion within 24-hour window
- Support 100 concurrent users

**Constraints**:

- Vercel deployment environment (serverless functions, edge runtime)
- Vercel Cron Jobs for scheduled tasks (daily sync)
- Supabase Storage for avatar hosting (1GB free tier)
- 1% data sampling for integrity verification
- 90% test pass rate requirement
- No downtime during deployment

**Scale/Scope**:

- ~10,000+ players from gomafia.pro
- ~50,000+ historical games
- ~100-500 concurrent users (initial launch)
- 5 user stories with 33 functional requirements
- 29 success criteria to meet

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Clean Architecture (NON-NEGOTIABLE)

✅ **PASS** - Feature builds on existing Next.js App Router architecture with clear separation:

- **Presentation**: React components in `src/components/`, pages in `src/app/`
- **Application**: API routes in `src/app/api/`, hooks in `src/hooks/`
- **Domain**: Business logic in `src/lib/`, services in `src/services/`
- **Infrastructure**: Database access via Prisma in `src/lib/db.ts`, external integrations isolated

No architectural violations. Authentication, profile management, sync logic, and testing improvements align with existing layers.

### II. Test-Driven Development (NON-NEGOTIABLE)

⚠️ **REQUIRES ATTENTION** - Current state has 0% test pass rate (0 of 195 tests passing)

- **Remediation Plan**:
  1. Fix critical broken infrastructure tests first (database connections, auth mocks, validation utilities)
  2. Then write tests for new features (profile page, admin bootstrap, sync notifications)
  3. Follow TDD for all new code: write failing tests, implement to pass, refactor
  4. Target: 90% pass rate before production release

**Justification**: Starting with broken tests requires fixing before TDD can be properly applied to new features. The balanced approach (fix critical tests + add new tests) is documented in spec clarifications.

### III. Spec-Driven Development

✅ **PASS** - Comprehensive specification completed with:

- 5 prioritized user stories (P1-P2) with independent value
- 33 functional requirements with clear acceptance criteria
- 10 edge cases identified
- 29 measurable success criteria
- All clarifications documented (6 questions answered)

### IV. Modern Frontend Best Practices

✅ **PASS** - Leveraging modern React patterns:

- Server Components and Client Components (Next.js 14 App Router)
- ShadCN/UI for accessible, reusable components
- TanStack Query for server state management
- Zustand for client state management
- Proper error boundaries to prevent crashes (FR-028)

### V. Package Management & Documentation

✅ **PASS** - Using Yarn exclusively per user rules

- All dependencies in yarn.lock
- Documentation in `docs/` folder requires updates (part of this feature)
- Context7 MCP available for accessing current documentation

### VI. Code Quality & Standards

⚠️ **REQUIRES ATTENTION** - Linting and testing need work

- **Current State**: Broken tests, some unused files, documentation drift
- **Remediation**: Part of this feature's scope (FR-022 to FR-028)
  - Remove unused files
  - Fix linting issues
  - Update documentation
  - Ensure consistent code style

**Overall Assessment**: ✅ **CONDITIONALLY APPROVED** - Architecture is sound. Test infrastructure issues and code quality concerns are explicitly addressed in feature scope. No constitutional violations; improvements are the feature goal itself.

## Project Structure

### Documentation (this feature)

```text
specs/009-first-release-prep/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - technical research and decisions
├── data-model.md        # Phase 1 output - database schema updates
├── quickstart.md        # Phase 1 output - quick implementation guide
├── contracts/           # Phase 1 output - API contracts
│   ├── auth-api.yaml           # Authentication and profile endpoints
│   ├── admin-api.yaml          # Admin management endpoints
│   ├── sync-api.yaml           # Data synchronization endpoints
│   └── vercel-cron.yaml        # Vercel Cron configuration
├── checklists/
│   └── requirements.md  # Specification quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Next.js Web Application Structure (existing, will be extended)

src/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # [EXTEND] Authentication routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── admin/
│   │       └── bootstrap/       # [NEW] Admin bootstrap page
│   ├── api/                     # API routes
│   │   ├── auth/                # [EXTEND] Auth endpoints
│   │   ├── profile/             # [NEW] Profile management
│   │   ├── admin/               # [NEW] Admin management
│   │   ├── gomafia-sync/        # [EXTEND] Sync endpoints
│   │   └── cron/                # [NEW] Vercel Cron handlers
│   │       └── daily-sync/
│   ├── profile/                 # [NEW] Profile page
│   ├── admin/                   # [NEW] Admin panel
│   │   └── users/
│   ├── games/                   # [FIX] Games display
│   ├── players/                 # [FIX] Players display
│   ├── tournaments/             # [FIX] Tournaments display
│   └── globals.css
├── components/                  # React components
│   ├── ui/                      # [EXTEND] ShadCN components
│   ├── auth/                    # [EXTEND] Auth components
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── AdminBootstrap.tsx   # [NEW]
│   ├── profile/                 # [NEW] Profile components
│   │   ├── ProfileHeader.tsx
│   │   ├── ProfileEditor.tsx
│   │   └── AvatarUpload.tsx
│   ├── admin/                   # [NEW] Admin components
│   │   └── UserManagement.tsx
│   ├── layout/                  # [EXTEND] Layout components
│   │   ├── Navbar.tsx           # [FIX] Add profile dropdown
│   │   └── ProfileDropdown.tsx  # [NEW]
│   └── sync/                    # [EXTEND] Sync status components
│       └── SyncNotifications.tsx # [NEW]
├── lib/                         # Utilities and configurations
│   ├── auth.ts                  # [EXTEND] Auth utilities
│   ├── db.ts                    # Database connection
│   ├── supabase/                # [NEW] Supabase client utilities
│   │   ├── client.ts
│   │   └── storage.ts           # Avatar storage utilities
│   ├── email/                   # [NEW] Email notifications
│   │   └── admin-alerts.ts
│   └── validations.ts           # [EXTEND] Form validations
├── hooks/                       # React hooks
│   ├── useAuth.ts               # [EXTEND] Authentication hook
│   ├── useProfile.ts            # [NEW] Profile management hook
│   └── useSyncStatus.ts         # [EXTEND] Sync status hook
├── services/                    # Business logic services
│   ├── auth/                    # [EXTEND] Auth services
│   │   ├── authService.ts
│   │   └── adminService.ts      # [NEW]
│   ├── sync/                    # [EXTEND] Sync services
│   │   ├── syncService.ts
│   │   └── notificationService.ts # [NEW]
│   └── storage/                 # [NEW] Storage services
│       └── avatarService.ts
└── types/                       # TypeScript types
    ├── auth.ts                  # [EXTEND] Auth types
    ├── profile.ts               # [NEW] Profile types
    └── admin.ts                 # [NEW] Admin types

prisma/
├── schema.prisma                # [VERIFY] Ensure all models exist
├── migrations/                  # Database migrations
└── seed.ts                      # [EXTEND] Seed data including admin

scripts/
├── create-first-admin.js        # [VERIFY/UPDATE] Admin bootstrap script
├── cleanup-unused-files.sh      # [NEW] Remove unused files
└── verify-deployment.sh         # [NEW] Pre-deployment checks

tests/
├── e2e/                         # [FIX & EXTEND] Playwright E2E tests
│   ├── auth/                    # [FIX] Authentication flows
│   │   ├── login.spec.ts
│   │   ├── signup.spec.ts
│   │   └── admin-bootstrap.spec.ts # [NEW]
│   ├── profile/                 # [NEW] Profile tests
│   │   └── profile-management.spec.ts
│   └── admin/                   # [NEW] Admin tests
│       └── user-management.spec.ts
├── integration/                 # [FIX & EXTEND] Integration tests
│   ├── api/                     # [FIX] API endpoint tests
│   │   ├── auth.test.ts
│   │   ├── profile.test.ts      # [NEW]
│   │   └── sync.test.ts
│   └── database/                # [FIX] Database tests
│       └── connection.test.ts
├── unit/                        # [FIX & EXTEND] Unit tests
│   ├── services/                # [FIX] Service tests
│   │   ├── authService.test.ts
│   │   ├── adminService.test.ts # [NEW]
│   │   └── syncService.test.ts
│   └── lib/                     # [FIX] Utility tests
│       ├── validations.test.ts
│       └── auth.test.ts
└── __mocks__/                   # [FIX] Test mocks
    ├── supabase.ts              # [NEW] Supabase mock
    └── prisma.ts                # [FIX] Prisma mock

docs/                            # [UPDATE] Documentation
├── README.md                    # [UPDATE] Main documentation
├── auth/                        # [UPDATE] Auth documentation
├── deployment/                  # [UPDATE] Deployment guides
│   └── DEPLOYMENT-CHECKLIST.md  # [UPDATE] Pre-release checklist
└── troubleshooting/             # [UPDATE] Troubleshooting guides
    └── QUICK-FIXES.md

vercel.json                      # [NEW/UPDATE] Vercel configuration with Cron
.env.example                     # [UPDATE] Environment variables template
```

**Structure Decision**: Using existing Next.js web application structure. This is a full-stack web application with:

- **Frontend**: React components in `src/components/`, pages using Next.js App Router in `src/app/`
- **Backend**: API routes in `src/app/api/`, services in `src/services/`
- **Testing**: Separate test directories for E2E, integration, and unit tests
- **Documentation**: Dedicated `docs/` folder for comprehensive documentation

The structure follows Next.js 14 conventions with App Router, maintaining clear separation between presentation (components), application logic (API routes, hooks), and business logic (services).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitutional violations requiring justification. The feature works within existing architecture and addresses quality issues (broken tests, documentation drift) that are blocking production readiness.

All complexity additions (admin management, sync notifications, avatar storage) are justified by functional requirements and have clear business value for production deployment.

---

**Next Steps**:

1. Phase 0: Generate `research.md` with technical decisions
2. Phase 1: Generate `data-model.md`, `/contracts/`, and `quickstart.md`
3. Phase 2: Run `/speckit.tasks` to break down into implementation tasks
