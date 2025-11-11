import { Player } from '@/domain/entities/player';
import type {
  ListPlayersRequest,
  ListPlayersResponse,
} from '@/application/contracts';

export interface PlayerPersistencePort {
  getById(id: string): Promise<Player | null>;
  list(query: ListPlayersRequest): Promise<ListPlayersResponse>;
  save(player: Player): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface TournamentPersistencePort<TTournament> {
  getById(id: string): Promise<TTournament | null>;
  recordAnalytics(
    tournamentId: string,
    analytics: Record<string, unknown>
  ): Promise<void>;
}

export interface ClubPersistencePort<TClub> {
  getById(id: string): Promise<TClub | null>;
  listMembers(clubId: string): Promise<string[]>;
}
