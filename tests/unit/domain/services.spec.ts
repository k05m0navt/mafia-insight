import { describe, it, expect } from 'vitest';
import { Player } from '@/domain/entities/player';
import { PlayerAnalyticsService } from '@/domain/services/player-analytics-service';

describe('Domain Services', () => {
  it('aggregates player analytics snapshot', () => {
    const player = new Player({
      id: 'player-analytics',
      name: 'Strategist',
      totalGames: 25,
      wins: 15,
      losses: 10,
      eloRating: 1650,
      region: 'EU',
      participations: [
        {
          id: 'game-1',
          date: new Date('2024-01-01'),
          role: 'Mafia',
          team: 'Black',
          isWinner: true,
          performanceScore: 92,
          gameStatus: 'completed',
          winnerTeam: 'Black',
        },
      ],
    });

    const analytics = PlayerAnalyticsService.buildOverview(player);

    expect(analytics.overall.winRate).toBeCloseTo(60);
    expect(analytics.recentGames).toHaveLength(1);
  });
});
