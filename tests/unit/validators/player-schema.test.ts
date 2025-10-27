import { describe, it, expect } from 'vitest';
import {
  playerSchema,
  type PlayerRawData,
} from '@/lib/gomafia/validators/player-schema';

describe('Player Schema Validation', () => {
  it('should validate correct player data', () => {
    const validPlayer: PlayerRawData = {
      gomafiaId: '575',
      name: 'Иван Иванов',
      region: 'Москва',
      club: 'Клуб "Мафия"',
      tournaments: 25,
      ggPoints: 1250,
      elo: 1450.5,
    };

    const result = playerSchema.safeParse(validPlayer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gomafiaId).toBe('575');
      expect(result.data.name).toBe('Иван Иванов');
    }
  });

  it('should reject player with missing required fields', () => {
    const invalidPlayer = {
      name: 'Test Player',
      region: 'Moscow',
      // Missing gomafiaId
    };

    const result = playerSchema.safeParse(invalidPlayer);
    expect(result.success).toBe(false);
  });

  it('should accept player with null optional fields', () => {
    const playerWithNulls: PlayerRawData = {
      gomafiaId: '123',
      name: 'Test Player',
      region: null,
      club: null,
      tournaments: 0,
      ggPoints: 0,
      elo: 1200,
    };

    const result = playerSchema.safeParse(playerWithNulls);
    expect(result.success).toBe(true);
  });

  it('should validate ELO rating range', () => {
    const playerLowElo: PlayerRawData = {
      gomafiaId: '100',
      name: 'Low ELO',
      region: null,
      club: null,
      tournaments: 0,
      ggPoints: 0,
      elo: -100,
    };

    const result = playerSchema.safeParse(playerLowElo);
    expect(result.success).toBe(false);
  });

  it('should validate name length', () => {
    const playerShortName: PlayerRawData = {
      gomafiaId: '200',
      name: 'A', // Too short
      region: null,
      club: null,
      tournaments: 0,
      ggPoints: 0,
      elo: 1200,
    };

    const result = playerSchema.safeParse(playerShortName);
    expect(result.success).toBe(false);
  });

  it('should handle very long names', () => {
    const playerLongName: PlayerRawData = {
      gomafiaId: '300',
      name: 'A'.repeat(51), // Max 50 characters
      region: null,
      club: null,
      tournaments: 0,
      ggPoints: 0,
      elo: 1200,
    };

    const result = playerSchema.safeParse(playerLongName);
    expect(result.success).toBe(false);
  });

  it('should accept high ELO ratings (5000+)', () => {
    const playerHighElo: PlayerRawData = {
      gomafiaId: '999',
      name: 'Pro Player',
      region: 'Санкт-Петербург',
      club: null,
      tournaments: 500,
      ggPoints: 50000,
      elo: 4500,
    };

    const result = playerSchema.safeParse(playerHighElo);
    expect(result.success).toBe(true);
  });
});
