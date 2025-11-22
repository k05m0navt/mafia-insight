# Architecture Dependency Map (Initial Audit)

_Date: 2025-11-10_

## Overview

- Audit focus: `src/services` and `src/app` (API routes & server components).
- Objective: surface modules mixing business rules with framework/lib concerns to prioritise Clean Architecture migration.
- Data sources: targeted `ripgrep` scans, manual review of representative files, `dependency-cruiser` snapshot (`docs/architecture/services-deps.json`).

## Service Layer Hotspots (`src/services`)

| Module                                                             | Primary Dependencies                           | Observations                                                                                                                                          |
| ------------------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `playerService.ts`                                                 | `@/lib/db`, `@/lib/validations`, `zod`         | Encapsulates pagination, analytics, and error handling directly against Prisma. Ideal candidate for `Domain` entities + `Application` orchestrators.  |
| `tournamentService.ts`                                             | `@/lib/db`, `@/lib/validations`                | Performs create/update logic with validation schemas. Business rules (stage transitions, minimum rounds) should move into `Domain` value objects.     |
| `clubService.ts`                                                   | `@/lib/db`, `@/lib/validations`                | Manages club CRUD with embedded invariants (name, region). Similar extraction path as tournaments/players.                                            |
| `analyticsService.ts`                                              | `@/lib/db`, `@/lib/gomafia`, helpers           | Aggregates metrics with direct data access. Split calculations into pure `Domain` services and keep persistence behind ports.                         |
| `sync/verificationService.ts`                                      | `@/lib/db`, `@/lib/gomafia/api`, `@/lib/audit` | Coordinates external API calls and persistence updates. Requires explicit `Application` use case with infrastructure adapters for Supabase/Gomafia.   |
| `sync/notificationService.ts`                                      | `@/lib/db`, `@/lib/email/adminAlerts`          | Mixes messaging side-effects with persistence. Should expose ports for email/messaging.                                                               |
| `permissionService.ts`, `navigationService.ts`                     | `@/types/*`, Zustand stores                    | Contain policy logic coupled to UI state types. Need separation between domain policies and UI representations.                                       |
| `AuthService.ts`, `RegressionTestService.ts`, `RecoveryService.ts` | direct imports from `@/lib/*`, `@/services/*`  | Utility-style services with side-effects (auth tokens, regression orchestrations) that should become application-level orchestrators backed by ports. |

**General findings**

- 100% of service modules import `@/lib/db` (Prisma) directly.
- Validation is tightly coupled via `@/lib/validations`; move schemas or enforce mapping through DTOs.
- No single entry point orchestrates services; API routes instantiate classes ad-hoc, complicating dependency inversion.

## App Router Hotspots (`src/app`)

- `rg "@/lib" src/app` → **135 imports across 59 files**: HTTP handlers grab Prisma clients, Gomafia utilities, and Supabase integrations directly.
- `rg "@/services" src/app` → **11 files** consuming monolithic services (`playerService`, `analyticsService`, etc.) without abstraction boundaries.
- Mixed concerns observed:
  - API handlers (e.g., `api/players/route.ts`, `api/tournaments/[id]/analytics/route.ts`) combine request parsing, business rules, and persistence.
  - Admin flows (`api/admin/import/*`) coordinate long-running jobs with cross-cutting concerns (audit logging, notifications) inline.
  - Authentication routes call Supabase + session helpers directly rather than through ports.

### Representative Modules

| Module                                   | Couplings                                              | Migration Notes                                                                                              |
| ---------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `api/players/route.ts`                   | `@/lib/db`, `zod`, `@/lib/gomafia/import/auto-trigger` | Should delegate orchestration to an `Application` use case that handles import trigger + querying via ports. |
| `api/gomafia-sync/sync/trigger/route.ts` | `@/services/sync/notificationService`, `@/lib/gomafia` | Split trigger logic into use case + infrastructure adapters (messaging).                                     |
| `api/admin/users/route.ts`               | `@/services/AuthService`, `@/lib/email`, `@/lib/db`    | Combine domain policy + email side-effects; requires ports for accounts + notifications.                     |
| `api/analytics/leaderboard/route.ts`     | `@/services/analyticsService`, `@/lib/cache/redis`     | Presents leaderboard logic; should become application orchestrator with caching adapter.                     |

## Next Steps

1. **Domain Extraction (Phase 3)**: Begin with `playerService`, `tournamentService`, `analyticsService` to establish core entities and pure services.
2. **Application Ports (Phase 4/5)**: Model Prisma interactions as persistence ports; define adapters for email, caching, and Gomafia APIs.
3. **Adapter Layer**: Rework API routes into thin controllers invoking application use cases.
4. **Guardrail Expansion**: Extend dependency-cruiser config to flag `src/app` imports from `@/lib/db` once adapters are in place.

_Audit owner: Architecture refactor strike team._
