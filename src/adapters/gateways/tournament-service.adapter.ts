import { TournamentService } from '@/services/tournamentService';
import type {
  GetTournamentAnalyticsRequest,
  TournamentAnalyticsResponse,
} from '@/application/contracts';
import { TournamentAnalyticsPort } from '@/application/ports';
import { ApplicationNotFoundError } from '@/application/errors';

export class TournamentServiceAdapter implements TournamentAnalyticsPort {
  private readonly service = new TournamentService();

  async getTournamentAnalytics({
    tournamentId,
  }: GetTournamentAnalyticsRequest): Promise<TournamentAnalyticsResponse> {
    let analytics;
    try {
      analytics = await this.service.getTournamentAnalytics(tournamentId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new ApplicationNotFoundError('Tournament not found');
      }
      throw error;
    }

    return {
      tournament: {
        id: analytics.tournament.id,
        name: analytics.tournament.name,
        status: analytics.tournament.status,
        startDate: analytics.tournament.startDate
          ? analytics.tournament.startDate.toISOString()
          : null,
        endDate: analytics.tournament.endDate
          ? analytics.tournament.endDate.toISOString()
          : null,
        gamesHosted: analytics.tournament.games.length,
      },
      gamesPlayed: analytics.gamesPlayed,
      averageDuration: analytics.averageDuration,
      winnerDistribution: analytics.winnerDistribution,
      participantStats: analytics.participantStats.map((player) => ({
        id: player.id,
        name: player.name,
        eloRating: player.eloRating,
        gamesPlayed: player.gamesPlayed,
        wins: player.wins,
        losses: player.losses,
        winRate: player.winRate,
        roles: player.roles,
      })),
      topPerformers: analytics.topPerformers.map((performer) => ({
        id: performer.id,
        name: performer.name,
        winRate: performer.winRate,
        gamesPlayed: performer.gamesPlayed,
      })),
    };
  }
}
