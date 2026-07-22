interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private static cache = new Map<string, CacheEntry>();
  private static hits = 0;
  private static misses = 0;
  private static writeCount = 0;

  /**
   * Generates a namespaced cache key
   */
  static makeKey(tenantId: string, namespace: string, subKey: string): string {
    return `sniper:${tenantId}:${namespace}:${subKey}`;
  }

  /**
   * Get an item from the cache
   */
  static get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  /**
   * Set an item in the cache with a Time-To-Live (TTL) in seconds
   */
  static set<T = any>(key: string, value: T, ttlSeconds = 600): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
    this.writeCount++;
  }

  /**
   * Delete an item from the cache
   */
  static del(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache items belonging to a specific tenant
   */
  static invalidateTenant(tenantId: string): void {
    const prefix = `sniper:${tenantId}:`;
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) || key.includes(`:${tenantId}:`)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`[CACHE SERVICE] Invalidated ${count} keys for tenant: ${tenantId}`);
  }

  /**
   * Get cache performance metrics for system diagnostics
   */
  static getMetrics() {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      writeCount: this.writeCount,
      hitRatePercent: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Fully purge the cache
   */
  static flushAll(): void {
    this.cache.clear();
    console.log('[CACHE SERVICE] Entire cache purged.');
  }
}
