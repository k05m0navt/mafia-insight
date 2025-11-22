export type GetTournamentAnalyticsRequest = {
  tournamentId: string;
};

export type TournamentAnalyticsResponse = {
  tournament: {
    id: string;
    name: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    gamesHosted: number;
  };
  gamesPlayed: number;
  averageDuration: number;
  winnerDistribution: {
    blackWins: number;
    redWins: number;
    draws: number;
  };
  participantStats: Array<{
    id: string;
    name: string;
    eloRating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    roles: string[];
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    winRate: number;
    gamesPlayed: number;
  }>;
};
