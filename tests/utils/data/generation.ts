import { faker } from '@faker-js/faker';

export interface DataGenerationConfig {
  count: number;
  locale?: string;
  seed?: number;
  includeRelationships?: boolean;
  dataQuality?: 'low' | 'medium' | 'high';
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'GUEST';
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerData {
  id: string;
  name: string;
  clubId?: string;
  rating: number;
  gamesPlayed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClubData {
  id: string;
  name: string;
  city: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentData {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TestDataGenerator {
  private config: DataGenerationConfig;

  constructor(config: DataGenerationConfig) {
    this.config = config;

    if (config.locale) {
      faker.setLocale(config.locale);
    }

    if (config.seed) {
      faker.seed(config.seed);
    }
  }

  generateUsers(): UserData[] {
    const users: UserData[] = [];
    const roles: Array<'USER' | 'ADMIN' | 'GUEST'> = ['USER', 'ADMIN', 'GUEST'];

    for (let i = 0; i < this.config.count; i++) {
      const user: UserData = {
        id: faker.datatype.uuid(),
        email: faker.internet.email(),
        name: faker.name.fullName(),
        role: faker.helpers.arrayElement(roles),
        createdAt: faker.date.past(2),
        updatedAt: faker.date.recent(30),
      };

      users.push(user);
    }

    return users;
  }

  generatePlayers(clubs?: ClubData[]): PlayerData[] {
    const players: PlayerData[] = [];

    for (let i = 0; i < this.config.count; i++) {
      const player: PlayerData = {
        id: faker.datatype.uuid(),
        name: faker.name.fullName(),
        clubId:
          clubs && clubs.length > 0
            ? faker.helpers.arrayElement(clubs).id
            : undefined,
        rating: this.generateRating(),
        gamesPlayed: faker.datatype.number({ min: 0, max: 1000 }),
        createdAt: faker.date.past(2),
        updatedAt: faker.date.recent(30),
      };

      players.push(player);
    }

    return players;
  }

  generateClubs(): ClubData[] {
    const clubs: ClubData[] = [];

    for (let i = 0; i < this.config.count; i++) {
      const club: ClubData = {
        id: faker.datatype.uuid(),
        name: faker.company.name() + ' Chess Club',
        city: faker.address.city(),
        country: faker.address.country(),
        createdAt: faker.date.past(5),
        updatedAt: faker.date.recent(30),
      };

      clubs.push(club);
    }

    return clubs;
  }

  generateTournaments(): TournamentData[] {
    const tournaments: TournamentData[] = [];

    for (let i = 0; i < this.config.count; i++) {
      const startDate = faker.date.future(1);
      const endDate = faker.date.between(
        startDate,
        new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      );

      const tournament: TournamentData = {
        id: faker.datatype.uuid(),
        name: faker.company.name() + ' Chess Tournament',
        startDate,
        endDate,
        location: faker.address.city() + ', ' + faker.address.country(),
        createdAt: faker.date.past(1),
        updatedAt: faker.date.recent(30),
      };

      tournaments.push(tournament);
    }

    return tournaments;
  }

  generateGameData(
    players: PlayerData[],
    tournaments?: TournamentData[]
  ): unknown[] {
    const games: unknown[] = [];
    const gameCount = Math.min(this.config.count, players.length * 2);

    for (let i = 0; i < gameCount; i++) {
      const whitePlayer = faker.helpers.arrayElement(players);
      let blackPlayer = faker.helpers.arrayElement(players);

      // Ensure different players
      while (blackPlayer.id === whitePlayer.id && players.length > 1) {
        blackPlayer = faker.helpers.arrayElement(players);
      }

      const game = {
        id: faker.datatype.uuid(),
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        tournamentId:
          tournaments && tournaments.length > 0
            ? faker.helpers.arrayElement(tournaments).id
            : undefined,
        result: faker.helpers.arrayElement(['1-0', '0-1', '1/2-1/2']),
        moves: this.generateMoves(),
        duration: faker.datatype.number({ min: 300, max: 3600 }), // 5 minutes to 1 hour
        createdAt: faker.date.past(1),
        updatedAt: faker.date.recent(30),
      };

      games.push(game);
    }

    return games;
  }

  generateAnalyticsData(): unknown {
    return {
      totalPlayers: faker.datatype.number({ min: 100, max: 10000 }),
      totalClubs: faker.datatype.number({ min: 10, max: 500 }),
      totalTournaments: faker.datatype.number({ min: 50, max: 1000 }),
      totalGames: faker.datatype.number({ min: 1000, max: 100000 }),
      averageRating: faker.datatype.number({ min: 1200, max: 2000 }),
      topPlayers: this.generateTopPlayers(),
      recentTournaments: this.generateRecentTournaments(),
      clubStatistics: this.generateClubStatistics(),
    };
  }

  generateEdgeCaseData(): unknown[] {
    const edgeCases: unknown[] = [];

    // Empty data
    edgeCases.push({
      type: 'empty',
      data: null,
    });

    // Very long strings
    edgeCases.push({
      type: 'long_string',
      data: {
        name: 'A'.repeat(1000),
        description: 'B'.repeat(5000),
      },
    });

    // Special characters
    edgeCases.push({
      type: 'special_chars',
      data: {
        name: 'Test User <script>alert("xss")</script>',
        email: 'test+user@example.com',
        description: 'Test with "quotes" and \'apostrophes\' and <tags>',
      },
    });

    // Unicode characters
    edgeCases.push({
      type: 'unicode',
      data: {
        name: 'José María González',
        city: 'São Paulo',
        country: 'Россия',
      },
    });

    // Extreme values
    edgeCases.push({
      type: 'extreme_values',
      data: {
        rating: 999999,
        gamesPlayed: -1,
        createdAt: new Date('1900-01-01'),
        updatedAt: new Date('2100-12-31'),
      },
    });

    return edgeCases;
  }

  private generateRating(): number {
    const baseRating = faker.datatype.number({ min: 800, max: 2800 });

    // Adjust based on data quality
    if (this.config.dataQuality === 'low') {
      return baseRating + faker.datatype.number({ min: -200, max: 200 });
    } else if (this.config.dataQuality === 'high') {
      return baseRating + faker.datatype.number({ min: -50, max: 50 });
    }

    return baseRating;
  }

  private generateMoves(): string[] {
    const moves: string[] = [];
    const moveCount = faker.datatype.number({ min: 10, max: 100 });

    const pieces = ['K', 'Q', 'R', 'B', 'N', 'P'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    for (let i = 0; i < moveCount; i++) {
      const piece = faker.helpers.arrayElement(pieces);
      const file = faker.helpers.arrayElement(files);
      const rank = faker.helpers.arrayElement(ranks);

      moves.push(`${piece}${file}${rank}`);
    }

    return moves;
  }

  private generateTopPlayers(): unknown[] {
    const players: unknown[] = [];
    const count = faker.datatype.number({ min: 5, max: 20 });

    for (let i = 0; i < count; i++) {
      players.push({
        id: faker.datatype.uuid(),
        name: faker.name.fullName(),
        rating: faker.datatype.number({ min: 2000, max: 2800 }),
        gamesPlayed: faker.datatype.number({ min: 100, max: 1000 }),
      });
    }

    return players.sort((a, b) => b.rating - a.rating);
  }

  private generateRecentTournaments(): unknown[] {
    const tournaments: unknown[] = [];
    const count = faker.datatype.number({ min: 3, max: 10 });

    for (let i = 0; i < count; i++) {
      const startDate = faker.date.recent(90);
      const endDate = faker.date.between(
        startDate,
        new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      );

      tournaments.push({
        id: faker.datatype.uuid(),
        name: faker.company.name() + ' Tournament',
        startDate,
        endDate,
        location: faker.address.city(),
        participants: faker.datatype.number({ min: 10, max: 100 }),
      });
    }

    return tournaments.sort(
      (a, b) => b.startDate.getTime() - a.startDate.getTime()
    );
  }

  private generateClubStatistics(): unknown[] {
    const clubs: unknown[] = [];
    const count = faker.datatype.number({ min: 5, max: 20 });

    for (let i = 0; i < count; i++) {
      clubs.push({
        id: faker.datatype.uuid(),
        name: faker.company.name() + ' Chess Club',
        city: faker.address.city(),
        members: faker.datatype.number({ min: 10, max: 500 }),
        averageRating: faker.datatype.number({ min: 1200, max: 2000 }),
        tournaments: faker.datatype.number({ min: 0, max: 50 }),
      });
    }

    return clubs.sort((a, b) => b.members - a.members);
  }

  // Static factory methods
  static createForUsers(
    count: number,
    options: Partial<DataGenerationConfig> = {}
  ): TestDataGenerator {
    return new TestDataGenerator({
      count,
      locale: 'en',
      dataQuality: 'medium',
      ...options,
    });
  }

  static createForPlayers(
    count: number,
    options: Partial<DataGenerationConfig> = {}
  ): TestDataGenerator {
    return new TestDataGenerator({
      count,
      locale: 'en',
      dataQuality: 'high',
      ...options,
    });
  }

  static createForClubs(
    count: number,
    options: Partial<DataGenerationConfig> = {}
  ): TestDataGenerator {
    return new TestDataGenerator({
      count,
      locale: 'en',
      dataQuality: 'medium',
      ...options,
    });
  }

  static createForTournaments(
    count: number,
    options: Partial<DataGenerationConfig> = {}
  ): TestDataGenerator {
    return new TestDataGenerator({
      count,
      locale: 'en',
      dataQuality: 'high',
      ...options,
    });
  }

  static createForEdgeCases(): TestDataGenerator {
    return new TestDataGenerator({
      count: 1,
      locale: 'en',
      dataQuality: 'low',
    });
  }
}
