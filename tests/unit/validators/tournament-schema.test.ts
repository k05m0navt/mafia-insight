import { describe, it, expect } from 'vitest';
import {
  tournamentSchema,
  type TournamentRawData,
} from '@/lib/gomafia/validators/tournament-schema';

describe('Tournament Schema Validation', () => {
  it('should validate correct tournament data', () => {
    const validTournament: TournamentRawData = {
      gomafiaId: 'tournament-123',
      name: 'Чемпионат Москвы 2025',
      stars: 5,
      averageElo: 1850.5,
      isFsmRated: true,
      startDate: '2025-01-15',
      endDate: '2025-01-20',
      status: 'COMPLETED',
      participants: 64,
    };

    const result = tournamentSchema.safeParse(validTournament);
    expect(result.success).toBe(true);
  });

  it('should reject tournament with invalid stars', () => {
    const invalidTournament: TournamentRawData = {
      gomafiaId: 'tournament-456',
      name: 'Test Tournament',
      stars: 10, // Max is 5
      averageElo: 1500,
      isFsmRated: false,
      startDate: '2025-01-01',
      endDate: null,
      status: 'IN_PROGRESS',
      participants: 32,
    };

    const result = tournamentSchema.safeParse(invalidTournament);
    expect(result.success).toBe(false);
  });

  it('should accept tournament without end date', () => {
    const ongoingTournament: TournamentRawData = {
      gomafiaId: 'tournament-789',
      name: 'Ongoing Tournament',
      stars: 3,
      averageElo: 1600,
      isFsmRated: true,
      startDate: '2025-10-01',
      endDate: null,
      status: 'IN_PROGRESS',
      participants: 16,
    };

    const result = tournamentSchema.safeParse(ongoingTournament);
    expect(result.success).toBe(true);
  });

  it('should validate tournament status enum', () => {
    const invalidStatus = {
      gomafiaId: 'tournament-999',
      name: 'Test',
      stars: 2,
      averageElo: 1400,
      isFsmRated: false,
      startDate: '2025-01-01',
      endDate: null,
      status: 'INVALID_STATUS',
      participants: 8,
    };

    const result = tournamentSchema.safeParse(invalidStatus);
    expect(result.success).toBe(false);
  });

  it('should validate participants count', () => {
    const negativeParticipants: TournamentRawData = {
      gomafiaId: 'tournament-111',
      name: 'Test Tournament',
      stars: 1,
      averageElo: 1200,
      isFsmRated: false,
      startDate: '2025-01-01',
      endDate: null,
      status: 'SCHEDULED',
      participants: -1,
    };

    const result = tournamentSchema.safeParse(negativeParticipants);
    expect(result.success).toBe(false);
  });
});
