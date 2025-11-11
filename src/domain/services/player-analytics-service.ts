import { Player } from '../entities/player';

export type PlayerAnalyticsOverview = {
  playerId: string;
  playerName: string;
  region: string | null | undefined;
  overall: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    eloRating: number;
  };
  recentGames: Array<{
    id: string;
    date: Date;
    role: string;
    team: string;
    isWinner: boolean;
    performanceScore: number;
    gameStatus: string;
    winnerTeam: string | null;
  }>;
};

export class PlayerAnalyticsService {
  static buildOverview(player: Player): PlayerAnalyticsOverview {
    const recentGames = player.recentParticipations.map((participation) => ({
      id: participation.id,
      date: new Date(participation.date),
      role: participation.role,
      team: participation.team,
      isWinner: participation.isWinner,
      performanceScore: participation.performanceScore,
      gameStatus: participation.gameStatus,
      winnerTeam: participation.winnerTeam,
    }));

    return {
      playerId: player.id,
      playerName: player.name,
      region: player.region,
      overall: {
        totalGames: player.totalGames,
        wins: player.wins,
        losses: player.losses,
        winRate: player.winRate,
        eloRating: player.eloRating,
      },
      recentGames,
    };
  }
}
