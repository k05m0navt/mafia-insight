/**
 * Raw data structures scraped from gomafia.pro.
 * These types represent the data BEFORE validation and transformation.
 */

export interface PlayerRawData {
  gomafiaId: string;
  name: string;
  region: string | null;
  club: string | null;
  tournaments: number;
  ggPoints: number;
  elo: number;
}

export interface ClubRawData {
  gomafiaId: string;
  name: string;
  region: string | null;
  president: string | null;
  members: number;
}

export interface TournamentRawData {
  gomafiaId: string;
  name: string;
  stars: number | null;
  averageElo: number | null;
  isFsmRated: boolean;
  startDate: string; // ISO date string
  endDate: string | null;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  participants: number;
}

export interface GameParticipationRawData {
  playerId: string;
  playerName: string;
  role: 'DON' | 'MAFIA' | 'SHERIFF' | 'CIVILIAN' | null;
  team: 'MAFIA' | 'CITIZENS' | null;
  isWinner: boolean;
  performanceScore: number | null;
}

export interface GameRawData {
  gomafiaId: string;
  tournamentId: string | null;
  date: string; // ISO date-time string
  durationMinutes: number | null;
  winnerTeam: 'BLACK' | 'RED' | 'DRAW' | null;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  participations?: GameParticipationRawData[]; // Optional for basic game data
}

export interface PlayerYearStatsRawData {
  year: number;
  totalGames: number;
  donGames: number;
  mafiaGames: number;
  sheriffGames: number;
  civilianGames: number;
  eloRating: number | null;
  extraPoints: number;
}

export interface PlayerTournamentRawData {
  tournamentId: string;
  tournamentName: string;
  placement: number | null;
  ggPoints: number | null;
  eloChange: number | null;
  prizeMoney: number | null;
}
