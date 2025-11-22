export type GetClubAnalyticsRequest = {
  clubId: string;
};

export type ClubAnalyticsResponse = {
  club: {
    id: string;
    name: string;
    region?: string | null;
    description?: string | null;
  };
  memberCount: number;
  totalGames: number;
  totalWins: number;
  winRate: number;
  averageElo: number;
  roleDistribution: Record<string, number>;
  topPerformers: Array<{
    id: string;
    name: string;
    eloRating: number;
    totalGames: number;
    wins: number;
    winRate: number;
  }>;
};
