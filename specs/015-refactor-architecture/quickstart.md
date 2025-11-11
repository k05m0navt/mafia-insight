# Quickstart: Architecture Refactor for SOLID Alignment

## Goal

Guide engineers through the initial setup required to work within the refactored Clean Architecture structure, run guardrails, and contribute new features safely.

## Prerequisites

- Node.js 18 and Yarn installed.
- Supabase project access with existing environment variables configured.
- Playwright browsers installed (`yarn playwright install`).

## Step-by-Step

1. **Install Dependencies**
   ```bash
   yarn install
   ```
2. **Generate Prisma Client & Prepare Database**
   ```bash
   yarn db:generate
   yarn db:migrate
   ```
3. **Bootstrap Architecture Layers**
   - Ensure `src/domain`, `src/application`, `src/adapters`, `src/infrastructure` exist (created by earlier phases).
   - Use the migration backlog in `docs/architecture/migration-backlog.md` to track remaining service moves.
4. **Run Automated Architecture Checks**
   ```bash
   yarn lint
   yarn test:arch           # new dependency graph/guardrail command
   ```
5. **Execute Targeted Test Suites**
   ```bash
   yarn test
   yarn test:integration
   yarn test --run tests/integration/internal-architecture/architecture-api.spec.ts
   ```
   > **Heads-up:** Many integration suites require an available Postgres instance seeded with Mafia Insight fixtures. Without a reachable database, tests that touch Prisma will fail with connection timeouts. Use `tests/setup-test-db.sh` or toggle the Prisma resilient DB mocks before running the full suite.
6. **Regenerate Architecture Map & Validate Internal APIs**
   ```bash
   yarn arch:map --output docs/architecture/map.json
   curl -H "Authorization: Bearer <token>" http://localhost:3000/internal/architecture
   curl -H "Authorization: Bearer <token>" http://localhost:3000/internal/onboarding/guide
   ```
7. **Launch the App in Development Mode**
   ```bash
   yarn dev
   ```
   Validate that domain-driven use cases operate via adapters and no direct framework imports remain in the domain layer.
8. **Publish Onboarding Updates**
   - Commit regenerated `docs/architecture/map.json`.
   - Review and, if needed, update `docs/onboarding/architecture.md`; log verification in `docs/architecture/audit-log.md`.

## Verification Checklist

- [ ] Domain modules have no imports from framework or infrastructure packages.
- [ ] Each critical flow has a dedicated use-case module with tests.
- [ ] `yarn test:arch` passes and CI guardrails block forbidden dependencies.
- [ ] Updated documentation (`docs/architecture`, onboarding guide) is committed.
- [ ] Regression tests (unit, integration, E2E) all pass (or failures documented with owner + ticket).
