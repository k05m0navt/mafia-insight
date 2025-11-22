import type {
  ListPlayersRequest,
  ListPlayersResponse,
  PlayerAnalyticsResponse,
  GetPlayerAnalyticsRequest,
  GetPlayerProfileRequest,
  PlayerProfileResponse,
} from '../contracts';

export interface PlayerQueryPort {
  listPlayers(request: ListPlayersRequest): Promise<ListPlayersResponse>;
}

export interface PlayerAnalyticsPort {
  getPlayerAnalytics(
    request: GetPlayerAnalyticsRequest
  ): Promise<PlayerAnalyticsResponse>;
}

export interface PlayerProfilePort {
  getPlayerProfile(
    request: GetPlayerProfileRequest
  ): Promise<PlayerProfileResponse>;
}
