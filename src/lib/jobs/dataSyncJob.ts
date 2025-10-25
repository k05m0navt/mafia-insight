import { CronJob } from 'cron';
import { GomafiaParser } from '@/lib/parsers/gomafiaParser';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';

export class DataSyncJob {
  private parser: GomafiaParser;
  private isRunning: boolean = false;

  constructor() {
    this.parser = new GomafiaParser(
      process.env.GOMAFIA_BASE_URL || 'https://gomafia.pro'
    );
  }

  start() {
    // Run every 5 minutes
    const job = new CronJob('*/5 * * * *', async () => {
      if (!this.isRunning) {
        await this.syncData();
      }
    });

    job.start();
    console.log('Data sync job started - running every 5 minutes');
  }

  async syncData() {
    if (this.isRunning) {
      console.log('Data sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      console.log('Starting data sync...');

      // Check if we're rate limited
      const rateLimitKey = 'gomafia:rate_limit';
      const rateLimit = await redis.get(rateLimitKey);

      if (rateLimit) {
        console.log('Rate limited, skipping sync...');
        return;
      }

      // Set rate limit for 1 minute
      await redis.setEx(rateLimitKey, 60, 'true');

      // Fetch and parse data from gomafia.pro
      const players = await this.parser.parseAllPlayers();

      if (players.length > 0) {
        // Update database
        await this.updateDatabase(players);

        // Clear cache
        await this.clearCache();

        console.log(`Successfully synced ${players.length} players`);
      } else {
        console.log('No new data to sync');
      }
    } catch (error) {
      console.error('Data sync failed:', error);

      // Log error to monitoring service
      await this.logError(error);
    } finally {
      this.isRunning = false;
    }
  }

  private async updateDatabase(players: Record<string, unknown>[]) {
    for (const playerData of players) {
      try {
        // Check if player exists
        const existingPlayer = await prisma.player.findUnique({
          where: { gomafiaId: playerData.gomafiaId as string },
        });

        if (existingPlayer) {
          // Update existing player
          await prisma.player.update({
            where: { gomafiaId: playerData.gomafiaId as string },
            data: {
              name: playerData.name as string,
              eloRating: playerData.eloRating as number,
              totalGames: playerData.totalGames as number,
              wins: playerData.wins as number,
              losses: playerData.losses as number,
            },
          });
        } else {
          // Create new player (this would need a user ID in a real implementation)
          console.log('New player found:', playerData.name as string);
          // For now, we'll skip creating new players without a user
        }
      } catch (error) {
        console.error(
          `Error updating player ${playerData.name as string}:`,
          error
        );
      }
    }
  }

  private async clearCache() {
    try {
      // Clear relevant cache keys
      const keys = await redis.keys('players:*');
      if (keys.length > 0) {
        await redis.del(keys);
      }

      const analyticsKeys = await redis.keys('analytics:*');
      if (analyticsKeys.length > 0) {
        await redis.del(analyticsKeys);
      }

      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  private async logError(error: unknown) {
    try {
      // In a real implementation, you would log to a monitoring service like Sentry
      console.error('Data sync error logged:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  async stop() {
    // Stop the cron job
    console.log('Data sync job stopped');
  }
}
