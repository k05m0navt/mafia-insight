import type {
  GetTournamentAnalyticsRequest,
  TournamentAnalyticsResponse,
} from '../contracts';
import { ApplicationValidationError } from '../errors';
import { TournamentAnalyticsPort } from '../ports';

export class GetTournamentAnalyticsUseCase {
  constructor(private readonly tournamentAnalytics: TournamentAnalyticsPort) {}

  async execute(
    request: GetTournamentAnalyticsRequest
  ): Promise<TournamentAnalyticsResponse> {
    const tournamentId = request.tournamentId?.trim();

    if (!tournamentId) {
      throw new ApplicationValidationError('tournamentId is required');
    }

    return this.tournamentAnalytics.getTournamentAnalytics({ tournamentId });
  }
}
