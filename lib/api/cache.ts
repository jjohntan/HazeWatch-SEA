interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();

  get<T>(key: string): { data: T; isStale: boolean; cachedAt: string } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    const isStale = now - entry.timestamp > entry.ttlMs;

    return {
      data: entry.data,
      isStale,
      cachedAt: new Date(entry.timestamp).toISOString(),
    };
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs: ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Global singleton cache
export const globalCache = new MemoryCache();
