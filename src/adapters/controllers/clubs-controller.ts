import type {
  ClubAnalyticsResponse,
  GetClubAnalyticsRequest,
} from '@/application/contracts';
import { GetClubAnalyticsUseCase } from '@/application/use-cases';
import { ClubServiceAdapter } from '../gateways/club-service.adapter';

export class ClubsController {
  private readonly getClubAnalyticsUseCase: GetClubAnalyticsUseCase;

  constructor(private readonly adapter = new ClubServiceAdapter()) {
    this.getClubAnalyticsUseCase = new GetClubAnalyticsUseCase(this.adapter);
  }

  getAnalytics(
    request: GetClubAnalyticsRequest
  ): Promise<ClubAnalyticsResponse> {
    return this.getClubAnalyticsUseCase.execute(request);
  }
}
