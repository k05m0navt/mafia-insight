# Implementation Plan: Architecture Refactor for SOLID Alignment

**Branch**: `015-refactor-architecture` | **Date**: 2025-11-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-refactor-architecture/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the Mafia Insight Next.js analytics platform to enforce SOLID and Clean Architecture. Deliver an isolated domain layer, explicit application use cases, stable interface adapters, automated dependency guardrails, and refreshed onboarding/architecture documentation so future teams can evolve the product without reintroducing coupling.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript on Node.js 18 (Next.js 14)  
**Primary Dependencies**: Next.js App Router, Prisma, Supabase JS client, TanStack Query, Zustand, Zod, Tailwind CSS  
**Storage**: Supabase (PostgreSQL) managed via Prisma schema  
**Testing**: Jest unit tests, Playwright E2E, ESLint/Prettier, forthcoming architecture guardrail checks  
**Target Platform**: Web (Next.js serverless/edge deployment)
**Project Type**: Full-stack web application (single Next.js workspace)  
**Performance Goals**: Preserve existing SLAs; keep critical flow latency within ±5% of current baseline and sustain existing load characteristics  
**Constraints**: Zero downtime migrations, maintain public API contracts, enforce TDD with ≥80% coverage, Yarn-only tooling, document all architectural rules  
**Scale/Scope**: Entire Mafia Insight codebase (players, tournaments, clubs modules) across frontend components, API routes, background scripts

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Clean Architecture**: Refactor plan centers on domain isolation, use-case orchestration, and dependency inversion. ✅
- **Test-Driven Development**: Every refactoring step will add/adjust tests first, maintaining ≥80% coverage. ✅
- **Spec-Driven Development**: Tasks map directly to the approved spec’s user stories and functional requirements. ✅
- **Modern Frontend Practices**: Adapter strategy maintains reusable, accessible React components and enforces WCAG AA compliance. ✅
- **Yarn & Documentation**: Tooling, scripts, and dependencies will be managed via Yarn with updated documentation. ✅
- **Quality Gates**: CI will run unit, integration, E2E, and new architecture checks before merge. ✅

**Post-Design Re-evaluation (2025-11-10)**: Research, data model, contracts, and quickstart artifacts reinforce Clean Architecture layering, mandate TDD-first execution, and document Yarn-based workflows. No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/015-refactor-architecture/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── app/                  # Next.js App Router routes and API handlers
├── components/           # Shared UI components (shadcn/ui, charts)
├── lib/                  # Utilities, configuration, Supabase helpers
├── services/             # Domain/integration services (to be reorganized)
├── hooks/                # React hooks
├── store/                # Zustand stores
├── types/                # Shared TypeScript types
├── scripts/              # Maintenance and migration scripts
└── tests-support/        # Test fixtures and utilities

tests/
├── unit/                 # Jest unit suites
├── integration/          # Combined service/use-case specs
└── e2e/                  # Playwright journeys
```

**Structure Decision**: Retain the single Next.js workspace while carving out new directories (`src/domain`, `src/application`, `src/adapters`, `src/infrastructure`) and aligning tests to mirror those layers. Existing folders (e.g., `src/services`) will be decomposed and relocated into the new structure.

## Complexity Tracking

No constitution exceptions or additional complexity justifications required.
