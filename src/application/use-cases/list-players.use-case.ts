import type {
  ListPlayersRequest,
  ListPlayersResponse,
  PlayerSortField,
} from '../contracts';
import { PlayerQueryPort } from '../ports';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_SORT_BY: PlayerSortField = 'lastSyncAt';
const DEFAULT_SORT_ORDER = 'desc';

export class ListPlayersUseCase {
  constructor(private readonly playerQuery: PlayerQueryPort) {}

  async execute(
    request: ListPlayersRequest = {}
  ): Promise<ListPlayersResponse> {
    const normalized = this.normalize(request);
    const response = await this.playerQuery.listPlayers(normalized);

    return {
      players: response.players,
      pagination: {
        ...response.pagination,
        page: normalized.page ?? DEFAULT_PAGE,
        limit: normalized.limit ?? DEFAULT_LIMIT,
      },
    };
  }

  private normalize(request: ListPlayersRequest): ListPlayersRequest {
    const page = request.page ?? DEFAULT_PAGE;
    const limit = request.limit ?? DEFAULT_LIMIT;

    return {
      page: Math.max(DEFAULT_PAGE, page),
      limit: Math.min(MAX_LIMIT, Math.max(1, limit)),
      search: request.search?.trim() || undefined,
      clubId: request.clubId?.trim() || undefined,
      sortBy: request.sortBy ?? DEFAULT_SORT_BY,
      sortOrder: request.sortOrder ?? DEFAULT_SORT_ORDER,
      syncStatus: request.syncStatus,
    };
  }
}
