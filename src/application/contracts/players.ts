export type PlayerSortField =
  | 'name'
  | 'eloRating'
  | 'totalGames'
  | 'wins'
  | 'losses'
  | 'lastSyncAt';

export type PlayerSyncStatus = 'SYNCED' | 'PENDING' | 'ERROR';

export type ListPlayersRequest = {
  page?: number;
  limit?: number;
  search?: string;
  clubId?: string;
  sortBy?: PlayerSortField;
  sortOrder?: 'asc' | 'desc';
  syncStatus?: PlayerSyncStatus;
};

export type PlayerSummary = {
  id: string;
  name: string;
  gomafiaId?: string | null;
  eloRating: number;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  lastSyncAt?: string | null;
  syncStatus?: string | null;
  clubId?: string | null;
  clubName?: string | null;
};

export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
};

export type ListPlayersResponse = {
  players: PlayerSummary[];
  pagination: PaginationInfo;
};

export type GetPlayerAnalyticsRequest = {
  playerId: string;
};

export type PlayerAnalyticsResponse = {
  player: {
    id: string;
    name: string;
    region?: string | null;
    eloRating: number;
    totalGames: number;
    wins: number;
    losses: number;
  };
  overallStats: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    eloRating: number;
  };
  roleStats: Array<{
    role: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  recentGames: Array<{
    gameId: string;
    date: string;
    role: string;
    team: string;
    isWinner: boolean;
    performanceScore: number;
    gameStatus: string;
    winnerTeam: string | null;
  }>;
};

export type GetPlayerProfileRequest = {
  playerId: string;
  year?: number;
};

export type PlayerProfileResponse = {
  id: string;
  gomafiaId: string | null;
  name: string;
  eloRating: number;
  totalGames: number;
  wins: number;
  losses: number;
  lastSyncAt: string | null;
  syncStatus: PlayerSyncStatus | null;
  clubId: string | null;
  club: {
    id: string;
    name: string | null;
  } | null;
  judgeCategory: string | null;
  judgeCanBeGs: number | null;
  judgeCanJudgeFinal: boolean;
  judgeMaxTablesAsGs: number | null;
  judgeRating: number | null;
  judgeGamesJudged: number | null;
  judgeAccreditationDate: string | null;
  judgeResponsibleFromSc: string | null;
  statistics: {
    totalGames: number;
    winRate: number;
    recentGames: Array<{
      game: {
        id: string;
        gomafiaId: string | null;
        date: string;
        status: string | null;
        winnerTeam: string | null;
        durationMinutes: number | null;
      };
    }>;
    roleStats: Record<
      string,
      {
        gamesPlayed: number;
        wins: number;
        losses: number;
        winRate: number;
      }
    >;
  };
  availableYears: number[];
};
