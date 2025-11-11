## Temporary Architecture Waivers

| ID     | Module                                                       | Waiver Description                                                                            | Approved By             | Expires    | Mitigation Plan                                                                           |
| ------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| WA-001 | `src/application/use-cases/get-player-analytics.use-case.ts` | Allows temporary access to Redis cache adapter until analytics port abstraction is completed. | @tech-lead-architecture | 2025-11-30 | Implement dedicated caching port and update use case to depend on interface.              |
| WA-002 | `src/app/api/analytics/leaderboard/route.ts`                 | Permits direct Prisma usage while leaderboard use case is migrated.                           | @platform-architect     | 2025-12-05 | Complete migration backlog item "Leaderboard orchestration" and remove direct dependency. |

### Management Guidelines

- Waivers must include owner, expiry, and mitigation to remain valid.
- Review waivers during weekly architecture governance sync.
- Expired waivers automatically trigger guardrail escalation.
