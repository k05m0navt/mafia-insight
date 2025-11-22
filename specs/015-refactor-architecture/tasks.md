# Task Plan: Architecture Refactor for SOLID Alignment

## Phase 1 – Setup & Governance Foundations

- [x] T001 Create `src/domain`, `src/application`, `src/adapters`, `src/infrastructure`, `tests/unit`, `tests/integration`, `tests/e2e`, `docs/architecture` directories per plan.md
- [x] T002 Document architecture rules stub in `docs/architecture/README.md` for iterative updates
- [x] T003 Configure architecture guardrail tooling scaffold (dependency-cruiser or ESLint) in `package.json` and `config/architecture-rules.json`

**Independent Test Criteria**

- Architecture folders exist with placeholder index files.
- Guardrail script runs (`yarn test:arch`) and reports TODO status without failures.

---

## Phase 2 – Technical Baseline & Tooling Enablement

- [x] T004 Audit existing imports to map domain logic hotspots in `src/services` and `src/app` to guide migration (record findings in `docs/architecture/map.md`)
- [x] T005 Establish testing harness updates for new layers in `tests-support/architecture-test-utils.ts`
- [x] T006 Implement CI wiring for architecture guardrails in `.github/workflows/ci.yml`

**Independent Test Criteria**

- Architecture map draft committed.
- New test utilities imported by at least one placeholder test.
- CI workflow fails if guardrail command exits non-zero.

---

## Phase 3 – User Story 1 (P1): Isolate the Domain Core

### Goal

Extract and stabilize business rules into a pure domain layer with no framework dependencies.

- [x] T007 [US1] Inventory and extract business rules from `src/services` into `src/domain` modules
- [x] T008 [US1] Author failing unit tests for domain entities in `tests/unit/domain/entities.test.ts`
- [x] T009 [US1] Create domain entity base types and value objects in `src/domain/entities/index.ts`
- [x] T010 [US1] Author failing unit tests for domain services in `tests/unit/domain/services.test.ts`
- [x] T011 [US1] Refactor domain services to use interfaces only in `src/domain/services`
- [x] T012 [US1] Remove framework imports from domain modules and add layer-specific lint rule in `.eslintrc.json`

**Independent Test Criteria**

- All domain unit tests pass without requiring Next.js, Prisma, or Supabase initialization.
- Architecture guardrail confirms zero forbidden imports in `src/domain`.

Parallel opportunities: T009/T011 can proceed in parallel once T008 and T010 establish failing tests.

---

## Phase 4 – User Story 2 (P2): Define Application Use Cases

### Goal

Expose business capabilities via orchestrated use-case services with explicit request/response contracts.

- [x] T013 [US2] Create use-case request/response DTO definitions in `src/application/contracts`
- [x] T014 [US2] Author failing integration tests for top 5 flows in `tests/integration/application/use-cases.spec.ts`
- [x] T015 [US2] Implement use-case orchestrators for top 5 critical flows in `src/application/use-cases`
- [x] T016 [US2] Update API routes and background jobs to call use cases via adapters in `src/app/**/route.ts` and related job scripts
- [x] T017 [US2] Document use-case catalogue in `docs/architecture/use-cases.md`

**Independent Test Criteria**

- Each critical flow executed from tests touches only use-case interfaces.
- Use-case catalogue shows coverage and status for top 5 flows.

Parallel opportunities: T013/T014 can progress in parallel after domain layer is stable; T016 depends on T015 completion.

---

## Phase 5 – User Story 3 (P2): Stabilize Interface & Infrastructure Boundaries

### Goal

Ensure adapters translate between the application core and external systems with replaceable implementations.

- [x] T018 [US3] Define ports/interfaces for persistence, caching, messaging in `src/application/ports`
- [x] T019 [US3] Author failing adapter contract tests in `tests/integration/adapters/adapters.spec.ts`
- [x] T020 [US3] Implement infrastructure adapters (Prisma, Supabase, Redis) in `src/infrastructure`
- [x] T021 [US3] Build presenter/view-model adapters for UI and API in `src/adapters/presenters`
- [x] T022 [US3] Update dependency guardrails to enforce port usage (no direct infrastructure imports) in `config/architecture-rules.json`

**Independent Test Criteria**

- Contract tests pass with real adapters swapped for test doubles.
- Guardrails flag any direct domain/application imports from infrastructure layers.

Parallel opportunities: T020/T021 can run in parallel once ports (T018) and tests (T019) are in place; T022 finalizes guardrails.

---

## Phase 6 – User Story 4 (P3): Govern Architecture Evolution

### Goal

Provide documentation, automated checks, and onboarding guidance to sustain the architecture.

- [x] T023 [US4] Document inversion-of-control rules and dependency flow guidelines in `docs/architecture/inversion-of-control.md`
- [x] T024 [US4] Expand architecture documentation with diagrams and layer responsibilities in `docs/architecture/README.md`
- [x] T025 [US4] Script architecture map generation command in `scripts/architecture/generate-map.ts`
- [x] T026 [US4] Author failing integration tests for internal architecture endpoints in `tests/integration/internal-architecture/architecture-api.spec.ts`
- [x] T027 [US4] Implement internal architecture validation endpoint `/internal/architecture/*` in `src/app/internal/architecture/route.ts`
- [x] T028 [US4] Compile migration guidance backlog with owners and timelines in `docs/architecture/migration-backlog.md`
- [x] T029 [US4] Publish onboarding checklist updates in `docs/onboarding/architecture.md`
- [x] T030 [US4] Validate architecture onboarding by running quickstart checklist and logging results in `docs/architecture/audit-log.md`
- [x] T031 [US4] Record temporary dependency waivers and mitigation tracking in `docs/architecture/waivers.md`

**Independent Test Criteria**

- Internal endpoint returns architecture map and validation status.
- New contributor can follow onboarding guide to complete sample use case within documented timeframe.

Parallel opportunities: T023–T025 can proceed simultaneously; T026 tests precede T027 implementation; T030 depends on updated onboarding materials; T031 can run alongside T028.

---

## Phase 7 – Polish & Cross-Cutting Validation

- [x] T032 Run full regression suite (`yarn lint`, `yarn test`, `yarn test:integration`, `yarn test:arch`, `yarn test:e2e`)
- [x] T033 Update onboarding quickstart (`specs/015-refactor-architecture/quickstart.md`) with final commands & verification notes
- [x] T034 Prepare architecture refactor release notes in `docs/releases/architecture-refactor.md`

**Independent Test Criteria**

- All automated checks pass.
- Release notes include summary, risks, rollback steps.

---

## Dependencies Overview

- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 (sequential)
- Within Phase 3: T007 prerequisite for T008–T012; tests (T008, T010) precede implementations (T009, T011)
- Within Phase 4: T013 prerequisite for T014–T017; T014 tests precede implementation (T015) and integration updates (T016)
- Within Phase 5: T018 prerequisite for T019–T022; T019 tests precede adapter implementations (T020/T021)
- Within Phase 6: T023–T025 prepare documentation/tooling before endpoint work; T026 tests precede T027 implementation; T028–T031 depend on documentation readiness

## Parallel Execution Highlights

- Phase 3: Domain entity modeling (T008) and service refactoring (T009) can proceed together post inventory.
- Phase 4: Develop DTOs (T012) and orchestrators (T013) concurrently once domain stabilized.
- Phase 5: Infrastructure adapters (T018) and presenter adapters (T019) can be built side-by-side.
- Phase 6: Documentation (T022) and tooling (T023/T024) can run in parallel with coordination.

## MVP Scope

Deliver Phase 1–3 to provide a fully isolated domain layer with guardrails and tests. This yields immediate value by preventing further architectural drift and enables subsequent phases to build on a stable core.
