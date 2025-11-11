import { describe, it, expect } from 'vitest';
import { DomainValidationError } from '@/domain/errors/domain-validation-error';
import { Player } from '@/domain/entities/player';

describe('Domain Entities', () => {
  it('enforces non-negative elo rating', () => {
    expect(
      () =>
        new Player({
          id: 'player-1',
          name: 'Night Fox',
          totalGames: 10,
          wins: 6,
          losses: 4,
          eloRating: -1,
          region: 'EU',
        })
    ).toThrowError(DomainValidationError);
  });

  it('calculates win rate based on totals', () => {
    const player = new Player({
      id: 'player-2',
      name: 'Rogue Agent',
      totalGames: 20,
      wins: 12,
      losses: 8,
      eloRating: 1520,
      region: 'US',
    });

    expect(player.winRate).toBeCloseTo(60);
  });
});
