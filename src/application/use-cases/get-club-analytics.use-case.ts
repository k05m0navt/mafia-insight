import type {
  ClubAnalyticsResponse,
  GetClubAnalyticsRequest,
} from '../contracts';
import { ApplicationValidationError } from '../errors';
import { ClubAnalyticsPort } from '../ports';

export class GetClubAnalyticsUseCase {
  constructor(private readonly clubAnalytics: ClubAnalyticsPort) {}

  async execute(
    request: GetClubAnalyticsRequest
  ): Promise<ClubAnalyticsResponse> {
    const clubId = request.clubId?.trim();

    if (!clubId) {
      throw new ApplicationValidationError('clubId is required');
    }

    return this.clubAnalytics.getClubAnalytics({ clubId });
  }
}
