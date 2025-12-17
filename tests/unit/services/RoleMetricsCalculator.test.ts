/**
 * Unit tests for RoleMetricsCalculator
 */

import { describe, it, expect } from 'vitest';
import {
  RoleMetricsCalculator,
  type GameParticipationData,
} from '@/domain/services/role-metrics-calculator';
import type { PlayerRole } from '@/types/analytics';

describe('RoleMetricsCalculator', () => {
  const calculator = new RoleMetricsCalculator();

  describe('calculateRoleMetrics', () => {
    it('should calculate metrics correctly for all roles', () => {
      const participationData: GameParticipationData[] = [
        {
          role: 'DON',
          gamesPlayed: 10,
          wins: 7,
          losses: 3,
          totalELO: 12500, // 10 games * 1250 ELO
        },
        {
          role: 'MAFIA',
          gamesPlayed: 8,
          wins: 4,
          losses: 4,
          totalELO: 9600, // 8 games * 1200 ELO
        },
        {
          role: 'SHERIFF',
          gamesPlayed: 5,
          wins: 2,
          losses: 3,
          totalELO: 6000, // 5 games * 1200 ELO
        },
        // CITIZEN has no data
      ];

      const result = calculator.calculateRoleMetrics(participationData);

      expect(result).toHaveLength(4);

      // Check DON metrics
      const donMetrics = result.find((m) => m.role === 'DON');
      expect(donMetrics).toBeDefined();
      expect(donMetrics?.winRate).toBe(70); // 7/10 * 100
      expect(donMetrics?.gamesPlayed).toBe(10);
      expect(donMetrics?.wins).toBe(7);
      expect(donMetrics?.losses).toBe(3);
      expect(donMetrics?.averageELO).toBe(1250); // 12500 / 10
      expect(donMetrics?.performanceLevel).toBe('excellent'); // >= 60%

      // Check MAFIA metrics
      const mafiaMetrics = result.find((m) => m.role === 'MAFIA');
      expect(mafiaMetrics).toBeDefined();
      expect(mafiaMetrics?.winRate).toBe(50); // 4/8 * 100
      expect(mafiaMetrics?.performanceLevel).toBe('good'); // >= 45% and < 60%

      // Check SHERIFF metrics
      const sheriffMetrics = result.find((m) => m.role === 'SHERIFF');
      expect(sheriffMetrics).toBeDefined();
      expect(sheriffMetrics?.winRate).toBe(40); // 2/5 * 100
      expect(sheriffMetrics?.performanceLevel).toBe('needs_improvement'); // < 45%

      // Check CITIZEN (no data)
      const citizenMetrics = result.find((m) => m.role === 'CITIZEN');
      expect(citizenMetrics).toBeDefined();
      expect(citizenMetrics?.gamesPlayed).toBe(0);
      expect(citizenMetrics?.winRate).toBe(0);
      expect(citizenMetrics?.performanceLevel).toBe('needs_improvement');
    });

    it('should handle zero games played', () => {
      const participationData: GameParticipationData[] = [];

      const result = calculator.calculateRoleMetrics(participationData);

      expect(result).toHaveLength(4);
      result.forEach((metrics) => {
        expect(metrics.gamesPlayed).toBe(0);
        expect(metrics.winRate).toBe(0);
        expect(metrics.averageELO).toBe(0);
      });
    });

    it('should handle division by zero gracefully', () => {
      const participationData: GameParticipationData[] = [
        {
          role: 'DON',
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          totalELO: 0,
        },
      ];

      const result = calculator.calculateRoleMetrics(participationData);

      const donMetrics = result.find((m) => m.role === 'DON');
      expect(donMetrics?.winRate).toBe(0);
      expect(donMetrics?.averageELO).toBe(0);
    });

    it('should round win rate and ELO to 2 decimal places', () => {
      const participationData: GameParticipationData[] = [
        {
          role: 'DON',
          gamesPlayed: 3,
          wins: 1,
          losses: 2,
          totalELO: 3666, // 3 games * 1222 ELO
        },
      ];

      const result = calculator.calculateRoleMetrics(participationData);

      const donMetrics = result.find((m) => m.role === 'DON');
      expect(donMetrics?.winRate).toBe(33.33); // 1/3 * 100 = 33.333... rounded to 33.33
      expect(donMetrics?.averageELO).toBe(1222); // 3666 / 3 = 1222
    });
  });

  describe('filterByRoles', () => {
    it('should filter metrics by role list', () => {
      const metrics = [
        {
          role: 'DON' as PlayerRole,
          winRate: 70,
          gamesPlayed: 10,
          wins: 7,
          losses: 3,
          averageELO: 1250,
          performanceLevel: 'excellent' as const,
        },
        {
          role: 'MAFIA' as PlayerRole,
          winRate: 50,
          gamesPlayed: 8,
          wins: 4,
          losses: 4,
          averageELO: 1200,
          performanceLevel: 'good' as const,
        },
        {
          role: 'SHERIFF' as PlayerRole,
          winRate: 40,
          gamesPlayed: 5,
          wins: 2,
          losses: 3,
          averageELO: 1200,
          performanceLevel: 'needs_improvement' as const,
        },
        {
          role: 'CITIZEN' as PlayerRole,
          winRate: 0,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          averageELO: 0,
          performanceLevel: 'needs_improvement' as const,
        },
      ];

      const filtered = calculator.filterByRoles(metrics, ['DON', 'MAFIA']);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((m) => m.role)).toEqual(['DON', 'MAFIA']);
    });

    it('should return all metrics if no roles specified', () => {
      const metrics = [
        {
          role: 'DON' as PlayerRole,
          winRate: 70,
          gamesPlayed: 10,
          wins: 7,
          losses: 3,
          averageELO: 1250,
          performanceLevel: 'excellent' as const,
        },
        {
          role: 'MAFIA' as PlayerRole,
          winRate: 50,
          gamesPlayed: 8,
          wins: 4,
          losses: 4,
          averageELO: 1200,
          performanceLevel: 'good' as const,
        },
      ];

      const filtered = calculator.filterByRoles(metrics);

      expect(filtered).toHaveLength(2);
    });

    it('should return empty array if roles list is empty', () => {
      const metrics = [
        {
          role: 'DON' as PlayerRole,
          winRate: 70,
          gamesPlayed: 10,
          wins: 7,
          losses: 3,
          averageELO: 1250,
          performanceLevel: 'excellent' as const,
        },
      ];

      const filtered = calculator.filterByRoles(metrics, []);

      expect(filtered).toHaveLength(0);
    });
  });
});
