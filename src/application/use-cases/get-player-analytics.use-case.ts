import type {
  GetPlayerAnalyticsRequest,
  PlayerAnalyticsResponse,
} from '../contracts';
import { ApplicationValidationError } from '../errors';
import { PlayerAnalyticsPort } from '../ports';

export class GetPlayerAnalyticsUseCase {
  constructor(private readonly playerAnalytics: PlayerAnalyticsPort) {}

  async execute(
    request: GetPlayerAnalyticsRequest
  ): Promise<PlayerAnalyticsResponse> {
    const playerId = request.playerId?.trim();

    if (!playerId) {
      throw new ApplicationValidationError('playerId is required');
    }

    return this.playerAnalytics.getPlayerAnalytics({ playerId });
  }
}
