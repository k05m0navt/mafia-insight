## Release Notes — Architecture Refactor (Clean Architecture Enforcement)

### Summary

- Introduced Clean Architecture governance for Mafia Insight, including inversion-of-control guidelines, documented migration backlog, waiver tracking, and automated architecture map generation.
- Added internal architecture endpoints (`/internal/architecture`, `/internal/onboarding/guide`) backed by dependency-cruiser analytics and onboarding metadata.
- Refined player services to respect new layering rules and eliminated legacy `any` usage and unreachable code paths.

### Key Changes

- Documentation: `docs/architecture/**`, `docs/onboarding/architecture.md`, `docs/architecture/audit-log.md`, `docs/architecture/waivers.md`, `specs/015-refactor-architecture/quickstart.md`.
- Tooling: `scripts/architecture/generate-map.ts`, `package.json` `arch:map` script, new architecture analysis/onboarding adapters.
- Application Code: Internal controller wiring, ports/use-cases for architecture governance, typed player adapters/services.

### Testing

- `yarn lint` ✅
- `yarn test:arch` ✅
- `yarn arch:map --output docs/architecture/map.json` ✅
- `yarn test --run tests/integration/internal-architecture/architecture-api.spec.ts` ✅
- `yarn test` ❌ (multiple pre-existing failures: DB connection timeouts and legacy suite assertions in signup form, sync orchestrator, auth service, and games API tests; see terminal log for details.)
- `yarn test:integration`, `yarn test:e2e` ⏭️ Not re-run after `yarn test` failure; would inherit the same Prisma connection issues without local Postgres configuration.

### Known Issues / Follow-ups

- Prisma-based suites require a reachable Postgres instance; tests fail when run offline. Coordinate with platform team to document mock configuration or provide dockerized DB for CI/local runs.
- Legacy UI tests (`SignupForm`) still use Chai DOM matchers; migrate to `@testing-library/jest-dom` equivalents to satisfy assertions.
- Sync orchestrator and games API specs depend on resilient DB mock adjustments; track remediation in architecture migration backlog.

### Rollback Plan

- Revert this feature branch and restore prior docs/tooling if governance changes block delivery.
- Disable new CI guardrails by removing `arch:map` and architecture rules updates if unexpected regressions appear; ensure rollbacks are documented in `docs/architecture/audit-log.md`.
