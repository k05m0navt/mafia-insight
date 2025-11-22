## Inversion of Control Guidelines

### Purpose

- Preserve inward-pointing dependencies championed by the Clean Architecture refactor.
- Ensure business logic remains framework-agnostic and technology swaps stay low risk.

### Layer Responsibilities

- **Domain**
  - Pure business rules, entities, and value objects.
  - No framework, database, or adapter imports—only TypeScript/standard library utilities.
  - Publishes intent via interfaces or domain events.

- **Application**
  - Orchestrates use cases and coordinates ports.
  - Depends on domain abstractions only.
  - May define request/response DTOs and map validation results to domain calls.

- **Adapters**
  - Translate between transports (HTTP, jobs, UI) and the application layer.
  - Contain serialization, authentication, and presenter logic—no business rules.
  - Resolve dependencies from the IoC container or factories, never `new` infrastructure directly.

- **Infrastructure**
  - Implements ports: persistence, messaging, caching, third-party APIs.
  - Handles retries, transactions, telemetry.
  - Registered with the IoC container so adapters/application can consume them via interfaces.

### Dependency Flow Rules

- Outermost layer chooses the concrete implementation; inner layers own the abstractions.
- Ports/interfaces live in `src/application/ports` (or domain equivalents) and must not import infrastructure.
- IoC composition roots (factories) sit in adapters or dedicated `src/infrastructure/composition` modules.
- Favor constructor injection over service locators—tests should inject doubles with no global state.
- Background jobs and API routes resolve use cases via composition helpers, never importing infrastructure directly.

### Enforcement

- `dependency-cruiser` rules block forbidden imports:
  - Domain → (application|adapters|infrastructure) ❌
  - Application → (adapters|infrastructure) ❌
  - Core (`domain|application`) → `src/lib` ❌
- `tests-support/architecture-test-utils.ts` exposes `assertCleanArchitecture` for suites to assert guardrails.
- CI runs `yarn test:arch` and fails on violation summaries.

### Operational Checklist

- [ ] New module depends only on allowed inner layers.
- [ ] Adapters instantiate use cases through factories or containers.
- [ ] Infrastructure modules implement explicit ports.
- [ ] Architecture documentation updated when creating new ports or adapters.
- [ ] Tests cover IoC boundaries (stubs/doubles for infrastructure).
