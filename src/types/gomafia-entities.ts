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
  role: 'DON' | 'MAFIA' | 'SHERIFF' | 'CITIZEN' | null;
  team: 'BLACK' | 'RED' | null;
  isWinner: boolean;
  performanceScore: number | null;
  eloChange: number | null;
  isFirstShoot: boolean;
  firstShootType:
    | 'NONE'
    | 'ZERO_MAFIA'
    | 'ONE_TWO_MAFIA'
    | 'THREE_MAFIA'
    | null;
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

export interface JudgeRawData {
  gomafiaId: string;
  name: string;
  category: string | null; // e.g., "Высшая категория", "1 категория"
  canBeGs: number | null; // Maximum number of games can be GS
  canJudgeFinal: boolean;
  maxTablesAsGs: number | null; // Maximum tables in role of GS
  rating: number | null;
  gamesJudged: number | null;
  accreditationDate: string | null; // ISO date string
  responsibleFromSc: string | null; // Responsible from SC FSM
}
