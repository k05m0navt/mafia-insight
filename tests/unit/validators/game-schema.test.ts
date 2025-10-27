import { describe, it, expect } from 'vitest';
import {
  gameSchema,
  type GameRawData,
} from '@/lib/gomafia/validators/game-schema';

describe('Game Schema Validation', () => {
  it('should validate correct game data', () => {
    const validGame: GameRawData = {
      gomafiaId: 'game-12345',
      tournamentId: 'tournament-123',
      date: '2025-10-25T14:30:00Z',
      durationMinutes: 45,
      winnerTeam: 'BLACK',
      status: 'COMPLETED',
    };

    const result = gameSchema.safeParse(validGame);
    expect(result.success).toBe(true);
  });

  it('should accept game without tournament', () => {
    const standaloneGame: GameRawData = {
      gomafiaId: 'game-67890',
      tournamentId: null,
      date: '2025-10-26T10:00:00Z',
      durationMinutes: 50,
      winnerTeam: 'RED',
      status: 'COMPLETED',
    };

    const result = gameSchema.safeParse(standaloneGame);
    expect(result.success).toBe(true);
  });

  it('should validate game status enum', () => {
    const invalidStatus = {
      gomafiaId: 'game-999',
      tournamentId: null,
      date: '2025-10-26T10:00:00Z',
      durationMinutes: 30,
      winnerTeam: 'BLACK',
      status: 'UNKNOWN_STATUS',
    };

    const result = gameSchema.safeParse(invalidStatus);
    expect(result.success).toBe(false);
  });

  it('should validate winner team enum', () => {
    const invalidWinner: GameRawData = {
      gomafiaId: 'game-111',
      tournamentId: null,
      date: '2025-10-26T10:00:00Z',
      durationMinutes: 40,
      winnerTeam: 'BLUE' as any, // Invalid team
      status: 'COMPLETED',
    };

    const result = gameSchema.safeParse(invalidWinner);
    expect(result.success).toBe(false);
  });

  it('should accept draw outcome', () => {
    const drawGame: GameRawData = {
      gomafiaId: 'game-222',
      tournamentId: 'tournament-456',
      date: '2025-10-26T15:00:00Z',
      durationMinutes: 60,
      winnerTeam: 'DRAW',
      status: 'COMPLETED',
    };

    const result = gameSchema.safeParse(drawGame);
    expect(result.success).toBe(true);
  });

  it('should validate duration is non-negative', () => {
    const negativeDuration: GameRawData = {
      gomafiaId: 'game-333',
      tournamentId: null,
      date: '2025-10-26T16:00:00Z',
      durationMinutes: -10,
      winnerTeam: 'BLACK',
      status: 'COMPLETED',
    };

    const result = gameSchema.safeParse(negativeDuration);
    expect(result.success).toBe(false);
  });

  it('should accept game with null duration', () => {
    const noDuration: GameRawData = {
      gomafiaId: 'game-444',
      tournamentId: null,
      date: '2025-10-26T17:00:00Z',
      durationMinutes: null,
      winnerTeam: 'RED',
      status: 'COMPLETED',
    };

    const result = gameSchema.safeParse(noDuration);
    expect(result.success).toBe(true);
  });
});
