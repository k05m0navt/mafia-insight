import { prisma } from '@/lib/db';
import { importOrchestrator } from './orchestrator';

export interface ImportStrategy {
  name: string;
  description: string;
  priority: number;
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
}

export class DataImportStrategy {
  private strategies: Map<string, ImportStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies() {
    // High priority strategies
    this.strategies.set('players', {
      name: 'Players',
      description: 'Import player data with basic information',
      priority: 1,
      batchSize: 100,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    this.strategies.set('tournaments', {
      name: 'Tournaments',
      description: 'Import tournament data and standings',
      priority: 2,
      batchSize: 50,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    this.strategies.set('games', {
      name: 'Games',
      description: 'Import game data and results',
      priority: 3,
      batchSize: 200,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    this.strategies.set('clubs', {
      name: 'Clubs',
      description: 'Import club data and memberships',
      priority: 4,
      batchSize: 50,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    // Medium priority strategies
    this.strategies.set('player_stats', {
      name: 'Player Statistics',
      description: 'Import detailed player statistics',
      priority: 5,
      batchSize: 100,
      retryAttempts: 2,
      retryDelay: 2000,
    });

    this.strategies.set('tournament_results', {
      name: 'Tournament Results',
      description: 'Import detailed tournament results',
      priority: 6,
      batchSize: 100,
      retryAttempts: 2,
      retryDelay: 2000,
    });

    // Low priority strategies
    this.strategies.set('historical_data', {
      name: 'Historical Data',
      description: 'Import historical data and archives',
      priority: 7,
      batchSize: 50,
      retryAttempts: 1,
      retryDelay: 5000,
    });
  }

  public getStrategy(name: string): ImportStrategy | undefined {
    return this.strategies.get(name);
  }

  public getAllStrategies(): ImportStrategy[] {
    return Array.from(this.strategies.values()).sort(
      (a, b) => a.priority - b.priority
    );
  }

  public async executeImport(
    strategyName: string,
    data: unknown[]
  ): Promise<string> {
    const strategy = this.getStrategy(strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    const importId = await importOrchestrator.startImport(
      strategyName,
      data.length
    );

    try {
      await this.processData(importId, strategy, data);
      await importOrchestrator.completeImport(importId);
      return importId;
    } catch (error) {
      await importOrchestrator.failImport(
        importId,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private async processData(
    importId: string,
    strategy: ImportStrategy,
    data: unknown[]
  ): Promise<void> {
    const batches = this.createBatches(data, strategy.batchSize);
    let processedRecords = 0;
    let errors = 0;

    for (const batch of batches) {
      try {
        await this.processBatch(strategy.name, batch);
        processedRecords += batch.length;
        await importOrchestrator.updateProgress(
          importId,
          processedRecords,
          errors
        );
      } catch (error) {
        console.error(`Error processing batch for ${strategy.name}:`, error);
        errors += batch.length;

        // Retry logic
        if (strategy.retryAttempts > 0) {
          await this.retryBatch(
            importId,
            strategy,
            batch,
            processedRecords,
            errors
          );
        }
      }
    }
  }

  private async processBatch(
    strategyName: string,
    batch: unknown[]
  ): Promise<void> {
    switch (strategyName) {
      case 'players':
        await this.importPlayers(batch);
        break;
      case 'tournaments':
        await this.importTournaments(batch);
        break;
      case 'games':
        await this.importGames(batch);
        break;
      case 'clubs':
        await this.importClubs(batch);
        break;
      case 'player_stats':
        await this.importPlayerStats(batch);
        break;
      case 'tournament_results':
        await this.importTournamentResults(batch);
        break;
      case 'historical_data':
        await this.importHistoricalData(batch);
        break;
      default:
        throw new Error(`Unknown strategy: ${strategyName}`);
    }
  }

  private async retryBatch(
    importId: string,
    strategy: ImportStrategy,
    batch: unknown[],
    processedRecords: number,
    errors: number
  ): Promise<void> {
    for (let attempt = 1; attempt <= strategy.retryAttempts; attempt++) {
      try {
        await new Promise((resolve) =>
          setTimeout(resolve, strategy.retryDelay * attempt)
        );
        await this.processBatch(strategy.name, batch);
        processedRecords += batch.length;
        errors = Math.max(0, errors - batch.length);
        await importOrchestrator.updateProgress(
          importId,
          processedRecords,
          errors
        );
        return;
      } catch (error) {
        console.error(
          `Retry attempt ${attempt} failed for ${strategy.name}:`,
          error
        );
        if (attempt === strategy.retryAttempts) {
          throw error;
        }
      }
    }
  }

  private createBatches(data: unknown[], batchSize: number): unknown[][] {
    const batches: unknown[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }

  // Import methods for different data types
  private async importPlayers(players: unknown[]): Promise<void> {
    // For demo purposes, we'll create a default user and use that
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      throw new Error('No user found. Please create a user first.');
    }

    await prisma.player.createMany({
      data: players.map((player) => ({
        id: player.id,
        userId: defaultUser.id,
        gomafiaId: player.gomafiaId || player.id,
        name: player.name,
        eloRating: player.eloRating || 1000,
        totalGames: player.totalGames || 0,
        wins: player.wins || 0,
        losses: player.losses || 0,
        region: player.region || 'US',
      })),
      skipDuplicates: true,
    });
  }

  private async importTournaments(tournaments: unknown[]): Promise<void> {
    // For demo purposes, we'll create a default user and use that
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      throw new Error('No user found. Please create a user first.');
    }

    await prisma.tournament.createMany({
      data: tournaments.map((tournament) => ({
        id: tournament.id,
        gomafiaId: tournament.gomafiaId || tournament.id,
        name: tournament.name,
        startDate: new Date(tournament.date),
        prizePool: tournament.prizeMoney || 0,
        maxParticipants: tournament.maxPlayers || 0,
        createdBy: defaultUser.id,
      })),
      skipDuplicates: true,
    });
  }

  private async importGames(games: unknown[]): Promise<void> {
    await prisma.game.createMany({
      data: games.map((game) => ({
        id: game.id,
        gomafiaId: game.gomafiaId || game.id,
        date: new Date(game.date),
        durationMinutes: game.durationMinutes || 0,
        winnerTeam: game.winner || 'UNKNOWN',
      })),
      skipDuplicates: true,
    });
  }

  private async importClubs(clubs: unknown[]): Promise<void> {
    // For demo purposes, we'll create a default user and use that
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      throw new Error('No user found. Please create a user first.');
    }

    await prisma.club.createMany({
      data: clubs.map((club) => ({
        id: club.id,
        name: club.name,
        description: club.description || '',
        createdBy: defaultUser.id,
      })),
      skipDuplicates: true,
    });
  }

  private async importPlayerStats(stats: unknown[]): Promise<void> {
    await prisma.playerYearStats.createMany({
      data: stats.map((stat) => ({
        playerId: stat.playerId,
        year: stat.year,
        totalGames: stat.totalGames || 0,
        donGames: stat.donGames || 0,
        mafiaGames: stat.mafiaGames || 0,
        sheriffGames: stat.sheriffGames || 0,
        civilianGames: stat.civilianGames || 0,
        eloRating: stat.eloRating || 1000,
        extraPoints: stat.extraPoints || 0,
      })),
      skipDuplicates: true,
    });
  }

  private async importTournamentResults(results: unknown[]): Promise<void> {
    await prisma.playerTournament.createMany({
      data: results.map((result) => ({
        playerId: result.playerId,
        tournamentId: result.tournamentId,
        placement: result.placement || 0,
        ggPoints: result.ggPoints || 0,
        eloChange: result.eloChange || 0,
      })),
      skipDuplicates: true,
    });
  }

  private async importHistoricalData(data: unknown[]): Promise<void> {
    // Placeholder for historical data import
    console.log(`Importing ${data.length} historical records`);
  }
}

// Export singleton instance
export const dataImportStrategy = new DataImportStrategy();
