import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/public/statistics/route';
import { prisma } from '@/lib/db';
import {
  createTestPlayer,
  createTestTournament,
  createTestClub,
} from '../../setup';

describe('Public Statistics API', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.gameParticipation.deleteMany({});
    await prisma.game.deleteMany({});
    await prisma.player.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.club.deleteMany({});
  });

  it('should return public statistics without authentication', async () => {
    // Create test data
    await createTestPlayer({ wins: 10, losses: 5, eloRating: 1500 });
    await createTestPlayer({ wins: 8, losses: 7, eloRating: 1400 });
    await createTestTournament();
    await createTestClub();

    const request = new NextRequest(
      'http://localhost:3000/api/public/statistics'
    );
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('totalPlayers');
    expect(data).toHaveProperty('totalGames');
    expect(data).toHaveProperty('totalTournaments');
    expect(data).toHaveProperty('totalClubs');
    expect(data).toHaveProperty('averageEloRating');
    expect(data).toHaveProperty('totalWins');
    expect(data).toHaveProperty('totalLosses');
    expect(data).toHaveProperty('lastUpdated');
  });

  it('should return correct player count', async () => {
    await createTestPlayer();
    await createTestPlayer();
    await createTestPlayer();

    const response = await GET();
    const data = await response.json();

    expect(data.totalPlayers).toBe(3);
  });

  it('should return correct game count (completed only)', async () => {
    // Create games with different statuses
    await prisma.game.createMany({
      data: [
        {
          status: 'COMPLETED',
          gomafiaId: 'game-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          status: 'COMPLETED',
          gomafiaId: 'game-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          status: 'IN_PROGRESS',
          gomafiaId: 'game-3',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const response = await GET();
    const data = await response.json();

    expect(data.totalGames).toBe(2); // Only completed games
  });

  it('should calculate average ELO rating correctly', async () => {
    await createTestPlayer({ eloRating: 1500 });
    await createTestPlayer({ eloRating: 1400 });
    await createTestPlayer({ eloRating: 1600 });

    const response = await GET();
    const data = await response.json();

    // Average: (1500 + 1400 + 1600) / 3 = 1500
    expect(data.averageEloRating).toBe(1500);
  });

  it('should return zero for average ELO when no players exist', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.averageEloRating).toBe(1200); // Default value
  });

  it('should return correct tournament count', async () => {
    await createTestTournament();
    await createTestTournament();

    const response = await GET();
    const data = await response.json();

    expect(data.totalTournaments).toBe(2);
  });

  it('should return correct club count', async () => {
    await createTestClub();
    await createTestClub();

    const response = await GET();
    const data = await response.json();

    expect(data.totalClubs).toBe(2);
  });

  it('should include cache headers in response', async () => {
    const response = await GET();

    expect(response.headers.get('Cache-Control')).toContain('public');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=300');
  });

  it('should handle database connection errors gracefully', async () => {
    // Mock Prisma to throw connection error
    const originalCount = prisma.player.count;
    prisma.player.count = async () => {
      throw { code: 'P1001', message: "Can't reach database server" };
    };

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Database connection failed');

    // Restore original
    prisma.player.count = originalCount;
  });

  it('should handle query timeout errors gracefully', async () => {
    // Mock Prisma to throw timeout error
    const originalCount = prisma.player.count;
    prisma.player.count = async () => {
      throw { code: 'P1008', message: 'Query timeout' };
    };

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(504);
    expect(data.error).toBe('Query timeout');

    // Restore original
    prisma.player.count = originalCount;
  });

  it('should handle generic Prisma errors', async () => {
    // Mock Prisma to throw generic error
    const originalCount = prisma.player.count;
    prisma.player.count = async () => {
      throw { code: 'P2002', message: 'Unique constraint violation' };
    };

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');

    // Restore original
    prisma.player.count = originalCount;
  });

  it('should handle generic errors', async () => {
    // Mock Prisma to throw generic error
    const originalCount = prisma.player.count;
    prisma.player.count = async () => {
      throw new Error('Unexpected error');
    };

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch public statistics');

    // Restore original
    prisma.player.count = originalCount;
  });

  it('should return valid ISO timestamp for lastUpdated', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.lastUpdated).toBeDefined();
    expect(() => new Date(data.lastUpdated)).not.toThrow();
    expect(new Date(data.lastUpdated).toISOString()).toBe(data.lastUpdated);
  });
});
