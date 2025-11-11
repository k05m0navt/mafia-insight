export type CacheEntryMetadata = {
  ttlSeconds?: number;
  tags?: string[];
};

export interface CachePort {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(
    key: string,
    value: T,
    metadata?: CacheEntryMetadata
  ): Promise<void>;
  delete(key: string): Promise<void>;
  invalidateTags(tags: string[]): Promise<void>;
}
