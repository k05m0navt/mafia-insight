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
      await this.processData(importId, strategyName, strategy, data);
      await importOrchestrator.completeImport(importId);
      return importId;
    } catch (error) {
      await importOrchestrator.failImport(importId);
      throw error;
    }
  }

  private async processData(
    importId: string,
    strategyKey: string,
    strategy: ImportStrategy,
    data: unknown[]
  ): Promise<void> {
    const batches = this.createBatches(data, strategy.batchSize);
    let processedRecords = 0;
    let errors = 0;

    for (const batch of batches) {
      try {
        await this.processBatch(strategyKey, batch);
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
            strategyKey,
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
    strategyKey: string,
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
        await this.processBatch(strategyKey, batch);
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
    // Get or create a default admin user for imports
    let defaultUser = await prisma.user.findFirst({
      where: {
        role: 'admin',
      },
    });

    // If no admin exists, try to find any user
    if (!defaultUser) {
      defaultUser = await prisma.user.findFirst();
    }

    // If still no user, create a system user for imports
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: `system-import-${Date.now()}@mafia-insight.local`,
          name: 'System Import User',
          role: 'admin',
        },
      });
    }

    await prisma.player.createMany({
      data: (players as Record<string, unknown>[]).map(
        (player: Record<string, unknown>) => ({
          id: player.id as string,
          userId: defaultUser.id,
          gomafiaId: (player.gomafiaId || player.id) as string,
          name: player.name as string,
          eloRating: (player.eloRating || 1000) as number,
          totalGames: (player.totalGames || 0) as number,
          wins: (player.wins || 0) as number,
          losses: (player.losses || 0) as number,
          region: (player.region || 'US') as string,
        })
      ),
      skipDuplicates: true,
    });
  }

  private async importTournaments(tournaments: unknown[]): Promise<void> {
    // Get or create a default admin user for imports
    let defaultUser = await prisma.user.findFirst({
      where: {
        role: 'admin',
      },
    });

    // If no admin exists, try to find any user
    if (!defaultUser) {
      defaultUser = await prisma.user.findFirst();
    }

    // If still no user, create a system user for imports
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: `system-import-${Date.now()}@mafia-insight.local`,
          name: 'System Import User',
          role: 'admin',
        },
      });
    }

    await prisma.tournament.createMany({
      data: (tournaments as Record<string, unknown>[]).map(
        (tournament: Record<string, unknown>) => ({
          id: tournament.id as string,
          gomafiaId: (tournament.gomafiaId || tournament.id) as string,
          name: tournament.name as string,
          startDate: new Date(tournament.date as string | number | Date),
          prizePool: (tournament.prizeMoney || 0) as number,
          maxParticipants: (tournament.maxPlayers || 0) as number,
          createdBy: defaultUser.id,
        })
      ),
      skipDuplicates: true,
    });
  }

  private async importGames(games: unknown[]): Promise<void> {
    await prisma.game.createMany({
      data: (games as Record<string, unknown>[]).map(
        (game: Record<string, unknown>) => ({
          id: game.id as string,
          gomafiaId: (game.gomafiaId || game.id) as string,
          date: new Date(game.date as string | number | Date),
          durationMinutes: (game.durationMinutes || 0) as number,
          winnerTeam: (game.winner || 'UNKNOWN') as 'BLACK' | 'RED' | 'DRAW',
        })
      ),
      skipDuplicates: true,
    });
  }

  private async importClubs(clubs: unknown[]): Promise<void> {
    // Get or create a default admin user for imports
    let defaultUser = await prisma.user.findFirst({
      where: {
        role: 'admin',
      },
    });

    // If no admin exists, try to find any user
    if (!defaultUser) {
      defaultUser = await prisma.user.findFirst();
    }

    // If still no user, create a system user for imports
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: `system-import-${Date.now()}@mafia-insight.local`,
          name: 'System Import User',
          role: 'admin',
        },
      });
    }

    // Ensure all clubs have valid data
    const clubsData = (clubs as Record<string, unknown>[]).map(
      (club: Record<string, unknown>) => ({
        id:
          (club.id as string) ||
          `club-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: (club.name as string) || 'Unnamed Club',
        description: (club.description || '') as string,
        createdBy: defaultUser.id,
        region: (club.region as string) || undefined,
        gomafiaId: (club.gomafiaId || club.id) as string | undefined,
      })
    );

    await prisma.club.createMany({
      data: clubsData,
      skipDuplicates: true,
    });
  }

  private async importPlayerStats(stats: unknown[]): Promise<void> {
    await prisma.playerYearStats.createMany({
      data: (stats as Record<string, unknown>[]).map(
        (stat: Record<string, unknown>) => ({
          playerId: stat.playerId as string,
          year: stat.year as number,
          totalGames: (stat.totalGames || 0) as number,
          donGames: (stat.donGames || 0) as number,
          mafiaGames: (stat.mafiaGames || 0) as number,
          sheriffGames: (stat.sheriffGames || 0) as number,
          civilianGames: (stat.civilianGames || 0) as number,
          eloRating: (stat.eloRating || 1000) as number,
          extraPoints: (stat.extraPoints || 0) as number,
        })
      ),
      skipDuplicates: true,
    });
  }

  private async importTournamentResults(results: unknown[]): Promise<void> {
    await prisma.playerTournament.createMany({
      data: (results as Record<string, unknown>[]).map(
        (result: Record<string, unknown>) => ({
          playerId: result.playerId as string,
          tournamentId: result.tournamentId as string,
          placement: (result.placement || 0) as number,
          ggPoints: (result.ggPoints || 0) as number,
          eloChange: (result.eloChange || 0) as number,
        })
      ),
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
