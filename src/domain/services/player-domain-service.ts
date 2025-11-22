import { Player } from '../entities/player';
import { DomainNotFoundError } from '../errors';
import { PlayerAnalyticsService } from './player-analytics-service';

export type PlayerListQuery = {
  page: number;
  limit: number;
  search?: string;
  clubId?: string;
};

export type PlayerListResult = {
  players: Player[];
  total: number;
  page: number;
  limit: number;
};

export interface PlayerReadRepository {
  findById(id: string): Promise<Player | null>;
  list(query: PlayerListQuery): Promise<PlayerListResult>;
}

export class PlayerDomainService {
  constructor(private readonly repository: PlayerReadRepository) {}

  async listPlayers(query: PlayerListQuery): Promise<PlayerListResult> {
    return this.repository.list(query);
  }

  async getPlayerById(id: string): Promise<Player> {
    const player = await this.repository.findById(id);
    if (!player) {
      throw new DomainNotFoundError('Player', id);
    }
    return player;
  }

  async getPlayerAnalytics(playerId: string) {
    const player = await this.getPlayerById(playerId);
    return PlayerAnalyticsService.buildOverview(player);
  }
}
