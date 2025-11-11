import type {
  GetTournamentAnalyticsRequest,
  TournamentAnalyticsResponse,
} from '../contracts';

export interface TournamentAnalyticsPort {
  getTournamentAnalytics(
    request: GetTournamentAnalyticsRequest
  ): Promise<TournamentAnalyticsResponse>;
}
