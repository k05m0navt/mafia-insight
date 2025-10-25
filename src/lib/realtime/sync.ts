import { supabase } from '../supabase';
import { cacheService } from '../cache/redis';
import { monitoringService } from '../monitoring';
import { errorTrackingService } from '../errorTracking';

interface SyncConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  syncInterval: number;
}

interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  errors: number;
  success: number;
}

class DataSyncService {
  private config: SyncConfig = {
    maxRetries: 3,
    retryDelay: 5000,
    batchSize: 100,
    syncInterval: 300000, // 5 minutes
  };

  private status: SyncStatus = {
    isRunning: false,
    lastSync: null,
    nextSync: null,
    errors: 0,
    success: 0,
  };

  private syncInterval?: NodeJS.Timeout;

  // Start automatic sync
  startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncAllData();
    }, this.config.syncInterval);

    // Set next sync time
    this.status.nextSync = new Date(Date.now() + this.config.syncInterval);
  }

  // Stop automatic sync
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    this.status.isRunning = false;
  }

  // Sync all data
  async syncAllData(): Promise<void> {
    if (this.status.isRunning) {
      console.log('Sync already running, skipping...');
      return;
    }

    this.status.isRunning = true;
    this.status.lastSync = new Date();

    try {
      await monitoringService.measureAsync('sync_all_data', async () => {
        // Sync players
        await this.syncPlayers();

        // Sync clubs
        await this.syncClubs();

        // Sync tournaments
        await this.syncTournaments();

        // Sync games
        await this.syncGames();

        // Update cache
        await this.updateCache();
      });

      this.status.success++;
      console.log('Data sync completed successfully');
    } catch (error) {
      this.status.errors++;
      errorTrackingService.trackError(error as Error, {
        severity: 'medium',
        url: 'data_sync',
      });
      console.error('Data sync failed:', error);
    } finally {
      this.status.isRunning = false;
      this.status.nextSync = new Date(Date.now() + this.config.syncInterval);
    }
  }

  // Sync players data
  private async syncPlayers(): Promise<void> {
    try {
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(this.config.batchSize);

      if (error) throw error;

      // Cache player data
      for (const player of players || []) {
        await cacheService.cachePlayerData(player.id, player);
      }

      console.log(`Synced ${players?.length || 0} players`);
    } catch (error) {
      throw new Error(`Failed to sync players: ${error}`);
    }
  }

  // Sync clubs data
  private async syncClubs(): Promise<void> {
    try {
      const { data: clubs, error } = await supabase
        .from('clubs')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(this.config.batchSize);

      if (error) throw error;

      // Cache club data
      for (const club of clubs || []) {
        await cacheService.cacheAnalytics('club', club.id, club);
      }

      console.log(`Synced ${clubs?.length || 0} clubs`);
    } catch (error) {
      throw new Error(`Failed to sync clubs: ${error}`);
    }
  }

  // Sync tournaments data
  private async syncTournaments(): Promise<void> {
    try {
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(this.config.batchSize);

      if (error) throw error;

      // Cache tournament data
      for (const tournament of tournaments || []) {
        await cacheService.cacheAnalytics(
          'tournament',
          tournament.id,
          tournament
        );
      }

      console.log(`Synced ${tournaments?.length || 0} tournaments`);
    } catch (error) {
      throw new Error(`Failed to sync tournaments: ${error}`);
    }
  }

  // Sync games data
  private async syncGames(): Promise<void> {
    try {
      const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(this.config.batchSize);

      if (error) throw error;

      // Cache game data
      for (const game of games || []) {
        await cacheService.set(`game:${game.id}`, game);
      }

      console.log(`Synced ${games?.length || 0} games`);
    } catch (error) {
      throw new Error(`Failed to sync games: ${error}`);
    }
  }

  // Update cache with fresh data
  private async updateCache(): Promise<void> {
    try {
      // Update leaderboards
      await this.updateLeaderboards();

      // Update analytics
      await this.updateAnalytics();

      console.log('Cache updated successfully');
    } catch (error) {
      throw new Error(`Failed to update cache: ${error}`);
    }
  }

  // Update leaderboards
  private async updateLeaderboards(): Promise<void> {
    try {
      // Player leaderboard
      const { data: players } = await supabase
        .from('players')
        .select('id, name, elo_rating, total_games, wins')
        .order('elo_rating', { ascending: false })
        .limit(50);

      if (players) {
        await cacheService.cacheLeaderboard('players', players);
      }

      // Club leaderboard
      const { data: clubs } = await supabase
        .from('clubs')
        .select(
          `
          id,
          name,
          players(count)
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (clubs) {
        await cacheService.cacheLeaderboard('clubs', clubs);
      }
    } catch (error) {
      console.error('Failed to update leaderboards:', error);
    }
  }

  // Update analytics
  private async updateAnalytics(): Promise<void> {
    try {
      // Update player analytics
      const { data: players } = await supabase.from('players').select('id');

      if (players) {
        for (const player of players) {
          const analytics = await this.calculatePlayerAnalytics(player.id);
          await cacheService.cacheAnalytics('player', player.id, analytics);
        }
      }
    } catch (error) {
      console.error('Failed to update analytics:', error);
    }
  }

  // Calculate player analytics
  private async calculatePlayerAnalytics(
    playerId: string
  ): Promise<Record<string, unknown> | null> {
    try {
      const { data: player } = await supabase
        .from('players')
        .select(
          `
          *,
          role_stats(*),
          participations(
            *,
            game(*)
          )
        `
        )
        .eq('id', playerId)
        .single();

      if (!player) return null;

      // Calculate analytics
      const analytics = {
        player,
        overallStats: {
          totalGames: player.total_games,
          wins: player.wins,
          losses: player.total_games - player.wins,
          winRate:
            player.total_games > 0
              ? (player.wins / player.total_games) * 100
              : 0,
          eloRating: player.elo_rating,
        },
        roleStats: player.role_stats,
        recentGames: player.participations?.slice(0, 10) || [],
      };

      return analytics;
    } catch (error) {
      console.error('Failed to calculate player analytics:', error);
      return null;
    }
  }

  // Manual sync with retry logic
  async syncWithRetry(): Promise<void> {
    let attempts = 0;

    while (attempts < this.config.maxRetries) {
      try {
        await this.syncAllData();
        return;
      } catch (error) {
        attempts++;

        if (attempts >= this.config.maxRetries) {
          throw error;
        }

        console.log(
          `Sync attempt ${attempts} failed, retrying in ${this.config.retryDelay}ms...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.retryDelay)
        );
      }
    }
  }

  // Get sync status
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  // Update sync configuration
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Force sync specific data
  async forceSync(
    type: 'players' | 'clubs' | 'tournaments' | 'games'
  ): Promise<void> {
    switch (type) {
      case 'players':
        await this.syncPlayers();
        break;
      case 'clubs':
        await this.syncClubs();
        break;
      case 'tournaments':
        await this.syncTournaments();
        break;
      case 'games':
        await this.syncGames();
        break;
    }
  }
}

export const dataSyncService = new DataSyncService();

// Initialize sync service
if (typeof window !== 'undefined') {
  // Start auto sync in browser
  dataSyncService.startAutoSync();
}
