import { faker } from '@faker-js/faker';

export interface PlayerData {
  id: string;
  name: string;
  email: string;
  rating: number;
  gamesPlayed: number;
  winRate: number;
  category: 'premium' | 'standard' | 'beginner';
  clubId: string;
  joinedAt: string;
  lastActiveAt: string;
  status: 'active' | 'inactive';
}

export interface ClubData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  averageRating: number;
  totalGames: number;
  winRate: number;
  status: 'active' | 'inactive';
  createdAt: string;
  lastActivityAt: string;
  location: string;
  category: 'premium' | 'standard' | 'beginner';
}

export interface TournamentData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  format: 'single_elimination' | 'swiss' | 'round_robin';
  location: string;
  category: 'premium' | 'standard' | 'beginner';
  createdAt: string;
  registrationDeadline: string;
  winner?: string;
  runnerUp?: string;
}

export class AnalyticsDataGenerator {
  /**
   * Generate player data
   */
  static generatePlayer(overrides: Partial<PlayerData> = {}): PlayerData {
    const categories: ('premium' | 'standard' | 'beginner')[] = [
      'premium',
      'standard',
      'beginner',
    ];
    const statuses: ('active' | 'inactive')[] = ['active', 'inactive'];

    const category = faker.helpers.arrayElement(categories);
    const rating =
      category === 'premium'
        ? faker.number.int({ min: 1800, max: 2000 })
        : category === 'standard'
          ? faker.number.int({ min: 1200, max: 1800 })
          : faker.number.int({ min: 800, max: 1200 });

    const gamesPlayed = faker.number.int({ min: 0, max: 500 });
    const wins = faker.number.int({ min: 0, max: gamesPlayed });
    const winRate = gamesPlayed > 0 ? wins / gamesPlayed : 0;

    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      rating,
      gamesPlayed,
      winRate: Math.round(winRate * 100) / 100,
      category,
      clubId: faker.string.uuid(),
      joinedAt: faker.date.past({ years: 2 }).toISOString(),
      lastActiveAt: faker.date.recent({ days: 30 }).toISOString(),
      status: faker.helpers.arrayElement(statuses),
      ...overrides,
    };
  }

  /**
   * Generate multiple players
   */
  static generatePlayers(
    count: number,
    overrides: Partial<PlayerData> = {}
  ): PlayerData[] {
    return Array.from({ length: count }, () => this.generatePlayer(overrides));
  }

  /**
   * Generate club data
   */
  static generateClub(overrides: Partial<ClubData> = {}): ClubData {
    const categories: ('premium' | 'standard' | 'beginner')[] = [
      'premium',
      'standard',
      'beginner',
    ];
    const statuses: ('active' | 'inactive')[] = ['active', 'inactive'];

    const category = faker.helpers.arrayElement(categories);
    const memberCount = faker.number.int({ min: 5, max: 50 });
    const averageRating =
      category === 'premium'
        ? faker.number.int({ min: 1800, max: 2000 })
        : category === 'standard'
          ? faker.number.int({ min: 1200, max: 1800 })
          : faker.number.int({ min: 800, max: 1200 });

    const totalGames = faker.number.int({ min: 50, max: 1000 });
    const wins = faker.number.int({ min: 0, max: totalGames });
    const winRate = totalGames > 0 ? wins / totalGames : 0;

    return {
      id: faker.string.uuid(),
      name: faker.company.name() + ' Mafia Club',
      description: faker.lorem.sentence(),
      memberCount,
      averageRating,
      totalGames,
      winRate: Math.round(winRate * 100) / 100,
      status: faker.helpers.arrayElement(statuses),
      createdAt: faker.date.past({ years: 3 }).toISOString(),
      lastActivityAt: faker.date.recent({ days: 7 }).toISOString(),
      location: faker.location.city() + ', ' + faker.location.stateAbbr(),
      category,
      ...overrides,
    };
  }

  /**
   * Generate multiple clubs
   */
  static generateClubs(
    count: number,
    overrides: Partial<ClubData> = {}
  ): ClubData[] {
    return Array.from({ length: count }, () => this.generateClub(overrides));
  }

  /**
   * Generate tournament data
   */
  static generateTournament(
    overrides: Partial<TournamentData> = {}
  ): TournamentData {
    const categories: ('premium' | 'standard' | 'beginner')[] = [
      'premium',
      'standard',
      'beginner',
    ];
    const statuses: ('upcoming' | 'ongoing' | 'completed' | 'cancelled')[] = [
      'upcoming',
      'ongoing',
      'completed',
      'cancelled',
    ];
    const formats: ('single_elimination' | 'swiss' | 'round_robin')[] = [
      'single_elimination',
      'swiss',
      'round_robin',
    ];

    const category = faker.helpers.arrayElement(categories);
    const status = faker.helpers.arrayElement(statuses);
    const format = faker.helpers.arrayElement(formats);

    const startDate = faker.date.future({ years: 1 });
    const endDate = new Date(
      startDate.getTime() +
        faker.number.int({ min: 1, max: 3 }) * 24 * 60 * 60 * 1000
    );

    const maxParticipants = faker.helpers.arrayElement([8, 16, 24, 32]);
    const participantCount =
      status === 'upcoming'
        ? 0
        : faker.number.int({ min: 1, max: maxParticipants });

    const entryFee =
      category === 'premium'
        ? faker.number.int({ min: 50, max: 200 })
        : category === 'standard'
          ? faker.number.int({ min: 10, max: 50 })
          : faker.number.int({ min: 5, max: 20 });

    const prizePool = entryFee * maxParticipants;

    const registrationDeadline = new Date(
      startDate.getTime() -
        faker.number.int({ min: 1, max: 7 }) * 24 * 60 * 60 * 1000
    );

    return {
      id: faker.string.uuid(),
      name: faker.company.buzzPhrase() + ' Tournament',
      description: faker.lorem.sentence(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      participantCount,
      maxParticipants,
      entryFee,
      prizePool,
      status,
      format,
      location: faker.location.city() + ', ' + faker.location.stateAbbr(),
      category,
      createdAt: faker.date.past({ years: 1 }).toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      ...(status === 'completed' && {
        winner: faker.string.uuid(),
        runnerUp: faker.string.uuid(),
      }),
      ...overrides,
    };
  }

  /**
   * Generate multiple tournaments
   */
  static generateTournaments(
    count: number,
    overrides: Partial<TournamentData> = {}
  ): TournamentData[] {
    return Array.from({ length: count }, () =>
      this.generateTournament(overrides)
    );
  }

  /**
   * Generate analytics overview data
   */
  static generateOverviewData() {
    return {
      totalPlayers: faker.number.int({ min: 100, max: 1000 }),
      totalClubs: faker.number.int({ min: 10, max: 100 }),
      totalTournaments: faker.number.int({ min: 20, max: 200 }),
      activeGames: faker.number.int({ min: 0, max: 50 }),
      averageRating: faker.number.int({ min: 1200, max: 1800 }),
      totalGamesPlayed: faker.number.int({ min: 1000, max: 10000 }),
      lastUpdated: faker.date.recent({ days: 1 }).toISOString(),
    };
  }

  /**
   * Generate leaderboard data
   */
  static generateLeaderboard(count: number = 10) {
    const players = this.generatePlayers(count);

    // Sort by rating descending
    players.sort((a, b) => b.rating - a.rating);

    // Add rank
    return players.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
  }

  /**
   * Generate filtered data
   */
  static generateFilteredData(
    dataType: 'players' | 'clubs' | 'tournaments',
    filters: Record<string, unknown>,
    count: number = 10
  ) {
    let data: unknown[] = [];

    switch (dataType) {
      case 'players':
        data = this.generatePlayers(count);
        break;
      case 'clubs':
        data = this.generateClubs(count);
        break;
      case 'tournaments':
        data = this.generateTournaments(count);
        break;
    }

    // Apply filters
    return data.filter((item) => {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) continue;

        if (key.includes('min') && item[key.replace('min', '')] < value) {
          return false;
        }

        if (key.includes('max') && item[key.replace('max', '')] > value) {
          return false;
        }

        if (
          key.includes('select') &&
          item[key.replace('select', '')] !== value
        ) {
          return false;
        }

        if (
          key === 'search' &&
          !item.name.toLowerCase().includes(value.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Generate edge case data
   */
  static generateEdgeCaseData() {
    return {
      // Empty data
      emptyPlayers: [],
      emptyClubs: [],
      emptyTournaments: [],

      // Single item
      singlePlayer: [this.generatePlayer()],
      singleClub: [this.generateClub()],
      singleTournament: [this.generateTournament()],

      // Extreme values
      extremePlayer: this.generatePlayer({
        rating: 3000,
        gamesPlayed: 10000,
        winRate: 1.0,
      }),

      extremeClub: this.generateClub({
        memberCount: 1000,
        averageRating: 3000,
        totalGames: 50000,
      }),

      extremeTournament: this.generateTournament({
        maxParticipants: 1000,
        entryFee: 10000,
        prizePool: 1000000,
      }),

      // Invalid data
      invalidPlayer: this.generatePlayer({
        rating: -100,
        gamesPlayed: -50,
        winRate: 2.0,
      }),

      invalidClub: this.generateClub({
        memberCount: -10,
        averageRating: -500,
        totalGames: -100,
      }),
    };
  }

  /**
   * Generate performance test data
   */
  static generatePerformanceData() {
    return {
      largePlayerDataset: this.generatePlayers(1000),
      largeClubDataset: this.generateClubs(100),
      largeTournamentDataset: this.generateTournaments(500),
      complexFilters: {
        rating: { min: 1500, max: 2000 },
        category: 'premium',
        status: 'active',
        dateRange: {
          start: '2025-01-01',
          end: '2025-12-31',
        },
      },
    };
  }

  /**
   * Generate anonymized data
   */
  static generateAnonymizedData() {
    return {
      players: this.generatePlayers(50).map((player) => ({
        ...player,
        name: `Player ${player.id.slice(0, 8)}`,
        email: `player.${player.id.slice(0, 8)}@example.com`,
      })),

      clubs: this.generateClubs(20).map((club) => ({
        ...club,
        name: `Club ${club.id.slice(0, 8)}`,
        location: 'Anonymized Location',
      })),

      tournaments: this.generateTournaments(30).map((tournament) => ({
        ...tournament,
        name: `Tournament ${tournament.id.slice(0, 8)}`,
        location: 'Anonymized Location',
      })),
    };
  }
}
