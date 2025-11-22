# Data Model: Architecture Refactor for SOLID Alignment

Although this initiative focuses on architectural restructuring rather than new business data, we must codify the core entities and their relationships to ensure consistent layering and contracts.

## Domain Entity (Business Core)

- **Purpose**: Encapsulate business rules for players, clubs, tournaments, analytics metrics, and supporting aggregates.
- **Key Fields**:
  - `id` (UUID)
  - Domain-specific attributes (e.g., `player.role`, `tournament.stage`, `club.region`)
  - Invariants (e.g., player rating cannot drop below zero; tournaments must have at least one round)
- **Relationships**:
  - Players ↔ Clubs (many-to-many through memberships)
  - Players ↔ Tournaments (many-to-many through participation)
  - Clubs ↔ Tournaments (organizer/sponsor roles)
- **State Transitions**:
  - `Draft` → `Active` → `Archived` for tournaments
  - Player analytics recalculated on import events
- **Validation Rules**:
  - Domain models enforce invariants internally and expose intention-revealing methods (no direct property mutation from outer layers).

## Use Case (Application Layer)

- **Purpose**: Coordinate domain entities for specific business capabilities (e.g., import data, compute insights, manage onboarding).
- **Inputs**: Request DTOs containing validated primitives and value objects.
- **Outputs**: Response DTOs summarizing domain entity changes or view models for presentation.
- **Policies**:
  - Each use case depends only on domain interfaces and ports.
  - Errors surfaced as domain-specific failures (`DomainError`, `ValidationError`) rather than framework exceptions.
- **State Transitions**:
  - Use cases trigger domain state changes, then publish events/messages to adapters.

## Interface Adapter (Presentation & Entry Points)

- **Purpose**: Translate between transport layer (HTTP, background jobs, UI) and the application layer.
- **Key Responsibilities**:
  - Deserialize incoming payloads into request DTOs.
  - Invoke corresponding use case.
  - Map responses to HTTP/GraphQL/React-ready formats.
- **Constraints**:
  - Must not contain business logic.
  - Can depend on frameworks (Next.js, React, TanStack Query) but only communicate through use-case ports.

## Infrastructure Gateway (External Integrations)

- **Purpose**: Implement ports for persistence, caching, messaging, external APIs, and automation scripts.
- **Examples**:
  - Prisma repositories for Supabase/PostgreSQL.
  - Redis cache adapters.
  - Playwright-based scrapers.
  - Email/notification gateways.
- **Policies**:
  - Exposed via interfaces (ports) defined inside `src/domain` or `src/application`.
  - Handle retries, transactions, and fault tolerance internally.

## Architecture Guideline Artifact

- **Purpose**: Metadata describing allowable dependencies, naming conventions, and module responsibilities.
- **Format**: Markdown + machine-enforced configuration (e.g., dependency-cruiser rules JSON, ESLint config).
- **Lifecycle**: Updated whenever new modules appear; referenced by onboarding materials and CI guardrails.

## Relationships Overview

- `Interface Adapters` call `Use Cases` using request DTOs.
- `Use Cases` manipulate `Domain Entities` and coordinate `Infrastructure Gateways` via ports.
- `Infrastructure Gateways` implement ports and interact with external systems.
- `Architecture Guideline Artifacts` govern all layers, ensuring dependency direction remains inward.
