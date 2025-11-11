import type {
  ListPlayersResponse,
  PlayerAnalyticsResponse,
  PlayerProfileResponse,
} from '@/application/contracts';

export class PlayerPresenter {
  static toListResponse(response: ListPlayersResponse) {
    return {
      players: response.players,
      pagination: {
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.pages,
        hasNext: response.pagination.hasNext ?? false,
        hasPrev: response.pagination.hasPrev ?? false,
      },
    };
  }

  static toAnalyticsResponse(response: PlayerAnalyticsResponse) {
    return response;
  }

  static toProfileResponse(response: PlayerProfileResponse) {
    return response;
  }
}
