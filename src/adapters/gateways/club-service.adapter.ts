import { ClubService } from '@/services/clubService';
import type {
  ClubAnalyticsResponse,
  GetClubAnalyticsRequest,
} from '@/application/contracts';
import { ClubAnalyticsPort } from '@/application/ports';
import { ApplicationNotFoundError } from '@/application/errors';

export class ClubServiceAdapter implements ClubAnalyticsPort {
  private readonly service = new ClubService();

  async getClubAnalytics({
    clubId,
  }: GetClubAnalyticsRequest): Promise<ClubAnalyticsResponse> {
    let analytics;
    try {
      analytics = await this.service.getClubAnalytics(clubId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new ApplicationNotFoundError('Club not found');
      }
      throw error;
    }

    return {
      club: {
        id: analytics.club.id,
        name: analytics.club.name,
        region: analytics.club.region,
        description: analytics.club.description,
      },
      memberCount: analytics.memberCount,
      totalGames: analytics.totalGames,
      totalWins: analytics.totalWins,
      winRate: analytics.winRate,
      averageElo: analytics.averageElo,
      roleDistribution: analytics.roleDistribution,
      topPerformers: analytics.topPerformers,
    };
  }
}
