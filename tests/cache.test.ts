import { describe, it, expect } from 'vitest';
import { globalCache } from '@/lib/api/cache';

describe('Global Memory Cache & TTL', () => {
  it('stores and retrieves cached data with fresh status', () => {
    const key = 'test:key:1';
    const val = { temp: 28, aqi: 45 };
    globalCache.set(key, val, 60); // 60s TTL

    const cached = globalCache.get<typeof val>(key);
    expect(cached).not.toBeNull();
    expect(cached?.data.aqi).toBe(45);
    expect(cached?.isStale).toBe(false);
  });

  it('detects stale data after TTL expiration', async () => {
    const key = 'test:key:stale';
    const val = { status: 'expired' };
    globalCache.set(key, val, -1); // negative TTL is already stale

    const cached = globalCache.get<typeof val>(key);
    expect(cached).not.toBeNull();
    expect(cached?.isStale).toBe(true);
  });
});
