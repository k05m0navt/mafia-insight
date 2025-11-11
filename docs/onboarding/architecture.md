---
{
  'version': '2025.11.10',
  'lastUpdated': '2025-11-10T09:30:00.000Z',
  'overview': 'Checklist and reference material for contributing to the Clean Architecture refactor.',
  'checklist':
    [
      'Install dependencies with yarn install',
      'Run yarn test:arch to ensure guardrails pass',
      'Generate the latest architecture map via yarn arch:map',
      'Review docs/architecture/inversion-of-control.md and docs/architecture/use-cases.md',
      'Log verification results in docs/architecture/audit-log.md',
    ],
  'references':
    [
      'https://mafiainsight.internal/wiki/architecture-governance',
      'docs/architecture/README.md',
      'docs/architecture/inversion-of-control.md',
      'docs/architecture/migration-backlog.md',
    ],
}
---

# Architecture Onboarding Guide

Welcome to the Clean Architecture refactor initiative. This guide captures the
minimum steps required to become productive while preserving the dependency
guardrails established in the refactor.

## Getting Started

- Clone the repository and ensure Node.js 18 with Yarn is installed.
- Request access to Supabase environment variables from the platform team.
- Generate Prisma clients with `yarn db:generate` (database migrations are optional for read-only flows).

## Core Expectations

1. **Respect dependency direction** – Domain code must stay framework-free.
2. **Lead with tests** – Add or adjust unit/integration suites before changing adapters.
3. **Document updates** – Every new port, adapter, or exception must be reflected in `docs/architecture`.

## Checklist

- [ ] Install dependencies (`yarn install`)
- [ ] Run guardrails (`yarn test:arch`)
- [ ] Generate current dependency map (`yarn arch:map --output docs/architecture/map.json`)
- [ ] Read `inversion-of-control.md` and related architecture docs
- [ ] Record outcomes in `docs/architecture/audit-log.md`

## Need Help?

- Reach out in `#proj-architecture-refactor`.
- Pair with an architecture strike team member for your first PR.
- Escalate urgent blockers to the engineering manager via Slack DM.
