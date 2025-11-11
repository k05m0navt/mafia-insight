import type {
  ListPlayersRequest,
  ListPlayersResponse,
  PlayerAnalyticsResponse,
  PlayerProfileResponse,
} from '@/application/contracts';
import {
  GetPlayerAnalyticsUseCase,
  GetPlayerProfileUseCase,
  ListPlayersUseCase,
} from '@/application/use-cases';
import { PlayerServiceAdapter } from '../gateways/player-service.adapter';

export class PlayersController {
  private readonly listPlayersUseCase: ListPlayersUseCase;
  private readonly getPlayerAnalyticsUseCase: GetPlayerAnalyticsUseCase;
  private readonly getPlayerProfileUseCase: GetPlayerProfileUseCase;

  constructor(private readonly adapter = new PlayerServiceAdapter()) {
    this.listPlayersUseCase = new ListPlayersUseCase(this.adapter);
    this.getPlayerAnalyticsUseCase = new GetPlayerAnalyticsUseCase(
      this.adapter
    );
    this.getPlayerProfileUseCase = new GetPlayerProfileUseCase(this.adapter);
  }

  listPlayers(request: ListPlayersRequest): Promise<ListPlayersResponse> {
    return this.listPlayersUseCase.execute(request);
  }

  getPlayerAnalytics(playerId: string): Promise<PlayerAnalyticsResponse> {
    return this.getPlayerAnalyticsUseCase.execute({ playerId });
  }

  getPlayerProfile(
    playerId: string,
    options: { year?: number } = {}
  ): Promise<PlayerProfileResponse> {
    return this.getPlayerProfileUseCase.execute({
      playerId,
      year: options.year,
    });
  }
}
