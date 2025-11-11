import type { CachePort, CacheEntryMetadata } from '@/application/ports';
import { cacheService } from '@/lib/cache/redis';

type FallbackEntry = {
  value: unknown;
  expiresAt?: number;
  tags: Set<string>;
};

export class RedisCacheAdapter implements CachePort {
  private readonly fallback = new Map<string, FallbackEntry>();
  private readonly tagIndex = new Map<string, Set<string>>();

  constructor(private readonly cache = cacheService) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const fallbackEntry = this.fallback.get(key);
    if (fallbackEntry && !this.isExpired(fallbackEntry.expiresAt)) {
      return fallbackEntry.value as T;
    }

    const value = await this.cache.get<T>(key);
    if (value !== null) {
      return value;
    }

    if (fallbackEntry) {
      this.fallback.delete(key);
    }

    return null;
  }

  async set<T = unknown>(
    key: string,
    value: T,
    metadata?: CacheEntryMetadata
  ): Promise<void> {
    this.detachTagsForKey(key);

    const ttlSeconds = metadata?.ttlSeconds;

    await this.cache.set(key, value, ttlSeconds);

    const tags = new Set(metadata?.tags ?? []);
    const expiresAt =
      typeof ttlSeconds === 'number'
        ? Date.now() + ttlSeconds * 1000
        : undefined;

    this.fallback.set(key, { value, expiresAt, tags });

    for (const tag of tags) {
      const keys = this.tagIndex.get(tag) ?? new Set<string>();
      keys.add(key);
      this.tagIndex.set(tag, keys);
    }
  }

  async delete(key: string): Promise<void> {
    await this.cache.del(key);

    this.detachTagsForKey(key);
    this.fallback.delete(key);
  }

  async invalidateTags(tags: string[]): Promise<void> {
    const keysToDelete = new Set<string>();

    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (!keys) {
        continue;
      }
      keys.forEach((key) => keysToDelete.add(key));
      this.tagIndex.delete(tag);
    }

    await Promise.all(
      Array.from(keysToDelete).map(async (key) => {
        await this.cache.del(key);
        this.detachTagsForKey(key);
        this.fallback.delete(key);
      })
    );
  }

  private isExpired(expiresAt?: number): boolean {
    return typeof expiresAt === 'number' && Date.now() > expiresAt;
  }

  private detachTagsForKey(key: string): void {
    const entry = this.fallback.get(key);
    if (!entry) {
      return;
    }

    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      if (!keys) {
        continue;
      }
      keys.delete(key);
      if (keys.size === 0) {
        this.tagIndex.delete(tag);
      }
    }
  }
}
