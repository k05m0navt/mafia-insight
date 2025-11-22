## Architecture Migration Backlog

| Item                            | Current State                                                                    | Target Layer                 | Owner              | Target Date | Notes                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------- | ---------------------------- | ------------------ | ----------- | ----------------------------------------------------------------------------------- |
| Player analytics orchestration  | Mixed Prisma + business rules in `src/services/analyticsService.ts`              | Application + Domain         | @data-arch         | 2025-11-21  | Extract remaining calculations into domain services and wire persistence via ports. |
| Tournament lifecycle management | Stage transitions live in API routes                                             | Domain                       | @gameplay-lead     | 2025-11-24  | Create explicit aggregate with invariants and publish events to adapters.           |
| Sync verification workflow      | Notification + persistence coupled in `src/services/sync/verificationService.ts` | Application + Infrastructure | @integration-owner | 2025-11-26  | Introduce use case that coordinates verification and emit messaging via ports.      |
| Auth recovery helpers           | UI-oriented helpers consume `AuthService.ts` directly                            | Adapters                     | @auth-squad        | 2025-11-28  | Move logic into use cases; adapters should only format responses.                   |
| Legacy validation schemas       | Zod schemas inside infrastructure adapters                                       | Domain/Application           | @schema-steward    | 2025-12-02  | Relocate validation to DTO mappers; align with IoC guidelines.                      |

### Workflow

- Review backlog weekly; update owner + target date as work is reprioritized.
- When an item completes, record outcome in `docs/architecture/audit-log.md` and remove from this table.
- Document new findings from guardrail violations or audits within 24 hours.
