import type {
  GetTournamentAnalyticsRequest,
  TournamentAnalyticsResponse,
} from '@/application/contracts';
import { GetTournamentAnalyticsUseCase } from '@/application/use-cases';
import { TournamentServiceAdapter } from '../gateways/tournament-service.adapter';

export class TournamentsController {
  private readonly getTournamentAnalyticsUseCase: GetTournamentAnalyticsUseCase;

  constructor(private readonly adapter = new TournamentServiceAdapter()) {
    this.getTournamentAnalyticsUseCase = new GetTournamentAnalyticsUseCase(
      this.adapter
    );
  }

  getAnalytics(
    request: GetTournamentAnalyticsRequest
  ): Promise<TournamentAnalyticsResponse> {
    return this.getTournamentAnalyticsUseCase.execute(request);
  }
}
