# Use-Case Catalogue

| Flow                         | Use Case                        | Entry Points                         | Ports / Dependencies                                             | Tests                                             |
| ---------------------------- | ------------------------------- | ------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------- |
| List Players Directory       | `ListPlayersUseCase`            | `GET /api/players`                   | `PlayerQueryPort` implemented by `PlayerServiceAdapter` (Prisma) | `tests/integration/application/use-cases.spec.ts` |
| Player Performance Analytics | `GetPlayerAnalyticsUseCase`     | `GET /api/players/:id/analytics`     | `PlayerAnalyticsPort` (`PlayerServiceAdapter`)                   | `tests/integration/application/use-cases.spec.ts` |
| Player Profile Overview      | `GetPlayerProfileUseCase`       | `GET /api/players/:id`               | `PlayerProfilePort` (`PlayerServiceAdapter`)                     | `tests/integration/application/use-cases.spec.ts` |
| Tournament Insights          | `GetTournamentAnalyticsUseCase` | `GET /api/tournaments/:id/analytics` | `TournamentAnalyticsPort` (`TournamentServiceAdapter`)           | `tests/integration/application/use-cases.spec.ts` |
| Club Health Metrics          | `GetClubAnalyticsUseCase`       | `GET /api/clubs/:id/analytics`       | `ClubAnalyticsPort` (`ClubServiceAdapter`)                       | `tests/integration/application/use-cases.spec.ts` |
| Admin Provisioning           | `CreateAdminUserUseCase`        | `POST /api/admin/users`              | `AdminUserManagementPort` (`AdminServiceAdapter`)                | `tests/integration/application/use-cases.spec.ts` |

## Notes

- Each use case operates on sanitized request DTOs defined in `src/application/contracts`.
- Controllers in `src/adapters/controllers` wire HTTP handlers to the application layer while gateways in `src/adapters/gateways` adapt existing services to the new ports.
- Integration coverage lives in a single spec for now; future phases will split per flow as adapters mature.
- Ports currently wrap existing Prisma/Supabase services. Dedicated infrastructure adapters will replace them during Phase 5 (US3).
