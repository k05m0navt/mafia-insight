import { createClient } from 'redis';

interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string;
}

class CacheService {
  private redis: ReturnType<typeof createClient>;
  private config: CacheConfig;

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    this.config = {
      ttl: 3600, // 1 hour default
      prefix: 'mafia-insight:',
    };
  }

  private getKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setEx(
        this.getKey(key),
        ttl || this.config.ttl,
        serializedValue
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushDb();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  // Cache patterns for different data types
  async cachePlayerData(
    playerId: string,
    data: unknown,
    ttl?: number
  ): Promise<void> {
    await this.set(`player:${playerId}`, data, ttl);
  }

  async getPlayerData<T>(playerId: string): Promise<T | null> {
    return this.get<T>(`player:${playerId}`);
  }

  async cacheAnalytics(
    entityType: string,
    entityId: string,
    data: unknown,
    ttl?: number
  ): Promise<void> {
    await this.set(`analytics:${entityType}:${entityId}`, data, ttl);
  }

  async getAnalytics<T>(
    entityType: string,
    entityId: string
  ): Promise<T | null> {
    return this.get<T>(`analytics:${entityType}:${entityId}`);
  }

  async cacheLeaderboard(
    type: string,
    data: unknown,
    ttl?: number
  ): Promise<void> {
    await this.set(`leaderboard:${type}`, data, ttl);
  }

  async getLeaderboard<T>(type: string): Promise<T | null> {
    return this.get<T>(`leaderboard:${type}`);
  }

  // Invalidate related cache entries
  async invalidatePlayerCache(playerId: string): Promise<void> {
    const patterns = [
      `player:${playerId}`,
      `analytics:player:${playerId}`,
      'leaderboard:players',
    ];

    for (const pattern of patterns) {
      await this.del(pattern);
    }
  }

  async invalidateClubCache(clubId: string): Promise<void> {
    const patterns = [`analytics:club:${clubId}`, 'leaderboard:clubs'];

    for (const pattern of patterns) {
      await this.del(pattern);
    }
  }

  async invalidateTournamentCache(tournamentId: string): Promise<void> {
    const patterns = [`analytics:tournament:${tournamentId}`];

    for (const pattern of patterns) {
      await this.del(pattern);
    }
  }
}

export const cacheService = new CacheService();
