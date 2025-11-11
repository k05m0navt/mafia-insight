import type {
  ClubAnalyticsResponse,
  GetClubAnalyticsRequest,
} from '../contracts';

export interface ClubAnalyticsPort {
  getClubAnalytics(
    request: GetClubAnalyticsRequest
  ): Promise<ClubAnalyticsResponse>;
}
