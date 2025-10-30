import { PrismaClient } from '@prisma/client';
import { getTestDatabase } from '../../config/database';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'GUEST';
  createdAt: Date;
  updatedAt: Date;
}

export interface TestPlayer {
  id: string;
  name: string;
  clubId?: string;
  rating?: number;
  gamesPlayed?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestClub {
  id: string;
  name: string;
  city?: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestTournament {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TestDataManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getTestDatabase();
  }

  // User management
  async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const defaultUser: Partial<TestUser> = {
      id: `test-user-${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      name: `Test User ${Date.now()}`,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData,
    };

    return await this.prisma.user.create({
      data: defaultUser as Record<string, unknown>,
    });
  }

  async createTestUsers(count: number): Promise<TestUser[]> {
    const users: TestUser[] = [];
    for (let i = 0; i < count; i++) {
      const user = await this.createTestUser({
        email: `testuser${i}@example.com`,
        name: `Test User ${i}`,
      });
      users.push(user);
    }
    return users;
  }

  async deleteTestUser(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async deleteAllTestUsers(): Promise<void> {
    await this.prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test',
        },
      },
    });
  }

  // Player management
  async createTestPlayer(
    playerData: Partial<TestPlayer> = {}
  ): Promise<TestPlayer> {
    const defaultPlayer: Partial<TestPlayer> = {
      id: `test-player-${Date.now()}`,
      name: `Test Player ${Date.now()}`,
      rating: 1500,
      gamesPlayed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...playerData,
    };

    return await this.prisma.player.create({
      data: defaultPlayer as Record<string, unknown>,
    });
  }

  async createTestPlayers(count: number): Promise<TestPlayer[]> {
    const players: TestPlayer[] = [];
    for (let i = 0; i < count; i++) {
      const player = await this.createTestPlayer({
        name: `Test Player ${i}`,
        rating: 1500 + i * 10,
      });
      players.push(player);
    }
    return players;
  }

  async deleteTestPlayer(playerId: string): Promise<void> {
    await this.prisma.player.delete({
      where: { id: playerId },
    });
  }

  async deleteAllTestPlayers(): Promise<void> {
    await this.prisma.player.deleteMany({
      where: {
        name: {
          contains: 'Test Player',
        },
      },
    });
  }

  // Club management
  async createTestClub(clubData: Partial<TestClub> = {}): Promise<TestClub> {
    const defaultClub: Partial<TestClub> = {
      id: `test-club-${Date.now()}`,
      name: `Test Club ${Date.now()}`,
      city: 'Test City',
      country: 'Test Country',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...clubData,
    };

    return await this.prisma.club.create({
      data: defaultClub as Record<string, unknown>,
    });
  }

  async createTestClubs(count: number): Promise<TestClub[]> {
    const clubs: TestClub[] = [];
    for (let i = 0; i < count; i++) {
      const club = await this.createTestClub({
        name: `Test Club ${i}`,
        city: `Test City ${i}`,
      });
      clubs.push(club);
    }
    return clubs;
  }

  async deleteTestClub(clubId: string): Promise<void> {
    await this.prisma.club.delete({
      where: { id: clubId },
    });
  }

  async deleteAllTestClubs(): Promise<void> {
    await this.prisma.club.deleteMany({
      where: {
        name: {
          contains: 'Test Club',
        },
      },
    });
  }

  // Tournament management
  async createTestTournament(
    tournamentData: Partial<TestTournament> = {}
  ): Promise<TestTournament> {
    const defaultTournament: Partial<TestTournament> = {
      id: `test-tournament-${Date.now()}`,
      name: `Test Tournament ${Date.now()}`,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      location: 'Test Location',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...tournamentData,
    };

    return await this.prisma.tournament.create({
      data: defaultTournament as Record<string, unknown>,
    });
  }

  async createTestTournaments(count: number): Promise<TestTournament[]> {
    const tournaments: TestTournament[] = [];
    for (let i = 0; i < count; i++) {
      const tournament = await this.createTestTournament({
        name: `Test Tournament ${i}`,
        startDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + (i + 7) * 24 * 60 * 60 * 1000),
      });
      tournaments.push(tournament);
    }
    return tournaments;
  }

  async deleteTestTournament(tournamentId: string): Promise<void> {
    await this.prisma.tournament.delete({
      where: { id: tournamentId },
    });
  }

  async deleteAllTestTournaments(): Promise<void> {
    await this.prisma.tournament.deleteMany({
      where: {
        name: {
          contains: 'Test Tournament',
        },
      },
    });
  }

  // Cleanup methods
  async cleanupAllTestData(): Promise<void> {
    await Promise.all([
      this.deleteAllTestUsers(),
      this.deleteAllTestPlayers(),
      this.deleteAllTestClubs(),
      this.deleteAllTestTournaments(),
    ]);
  }

  async getTestDataCounts(): Promise<{
    users: number;
    players: number;
    clubs: number;
    tournaments: number;
  }> {
    const [users, players, clubs, tournaments] = await Promise.all([
      this.prisma.user.count({
        where: { email: { contains: 'test' } },
      }),
      this.prisma.player.count({
        where: { name: { contains: 'Test Player' } },
      }),
      this.prisma.club.count({
        where: { name: { contains: 'Test Club' } },
      }),
      this.prisma.tournament.count({
        where: { name: { contains: 'Test Tournament' } },
      }),
    ]);

    return { users, players, clubs, tournaments };
  }
}
