# Research: Architecture Refactor for SOLID Alignment

## Decision 1: Layered Module Segmentation

- **Decision**: Introduce explicit `domain`, `application`, `adapters`, and `infrastructure` packages under `src/` with dependency arrows pointing inward only.
- **Rationale**: Aligns with Clean Architecture guidance (Jason Taylor template, Context7) to protect business rules from framework churn and makes SOLID compliance auditable.
- **Alternatives considered**: Keep implicit conventions within existing folders—rejected because cross-imports already intermingle responsibilities and hinder dependency analysis.

## Decision 2: Use-Case Orchestrator Contracts

- **Decision**: Model each critical business flow (e.g., import tournament data, compute analytics) as an application service exposing request/response DTOs and policies.
- **Rationale**: Provides SRP-compliant entry points and makes new features additive (OCP) while enabling contract tests against mocked gateways.
- **Alternatives considered**: Maintain route-level orchestration in Next.js handlers—rejected due to tight coupling with HTTP concerns and poor reusability for background jobs.

## Decision 3: Interface Abstraction for External Systems

- **Decision**: Define ports for persistence, messaging, caching, and third-party APIs plus adapter implementations (Supabase, Playwright scrapers, external analytics feeds).
- **Rationale**: Enforces Dependency Inversion, enables deterministic tests, and future-proofs integrations (e.g., migrating away from Supabase if needed).
- **Alternatives considered**: Direct imports of Prisma/Supabase into domain services—rejected as it locks business logic to implementation details and violates DIP.

## Decision 4: Automated Architecture Guardrails

- **Decision**: Adopt tooling (e.g., dependency-cruiser or custom ESLint rules) to fail CI when outer layers import inner layers counter to rules.
- **Rationale**: Constitution mandates verifiable Clean Architecture compliance; automated checks prevent regression and support SC-004.
- **Alternatives considered**: Manual code reviews only—rejected due to high drift risk and inability to guarantee compliance at scale.

## Decision 5: Documentation & Onboarding Enhancements

- **Decision**: Publish architecture map, layering guidelines, coding standards, and migration backlog within `/docs` and feature spec artifacts; integrate into onboarding checklist.
- **Rationale**: Supports FR-006/FR-009 and success metrics (SC-005) by giving new contributors a clear path to compliant changes.
- **Alternatives considered**: Lightweight README update—rejected because sustained governance needs dedicated artifacts and accountability trail.
