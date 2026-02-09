/**
 * Simple In-Memory Cache with TTL (Time-To-Live)
 *
 * Provides a lightweight caching layer to reduce file I/O operations.
 * Each cached value has an expiration time after which it's automatically
 * considered stale and will be refreshed on the next access.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Run cleanup every 60 seconds to remove expired entries
    // This prevents memory leaks from accumulated expired entries
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000);

      // Don't block process exit
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Get a value from the cache
   * Returns undefined if the key doesn't exist or has expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Set a value in the cache with a TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlMs - Time-to-live in milliseconds
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a prefix
   * Useful for invalidating related cache entries
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get the number of entries in the cache (including potentially expired ones)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove all expired entries from the cache
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Stop the cleanup interval (useful for testing or shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Export a singleton instance for the application
export const cache = new MemoryCache();

// Cache key constants for consistency
export const CACHE_KEYS = {
  DATABASE: 'db:full',
  ROOMS: 'db:rooms',
  BOOKINGS: 'db:bookings',
  AVAILABILITY: 'db:availability',
  GUESTS: 'db:guests',
} as const;

// Default TTL values in milliseconds
export const TTL = {
  SHORT: 5 * 1000,           // 5 seconds - for frequently changing data
  MEDIUM: 30 * 1000,         // 30 seconds - default for availability/bookings
  LONG: 5 * 60 * 1000,       // 5 minutes - for rarely changing data like rooms
  VERY_LONG: 30 * 60 * 1000, // 30 minutes - for static configuration
} as const;

/**
 * Invalidate all database-related caches
 * Call this after any write operation to ensure data consistency
 */
export function invalidateDbCache(): void {
  cache.deleteByPrefix('db:');
}

/**
 * Helper function to get or set a cached value
 * If the value exists in cache and isn't expired, return it
 * Otherwise, call the factory function, cache the result, and return it
 */
export function getOrSet<T>(
  key: string,
  factory: () => T,
  ttlMs: number = TTL.MEDIUM
): T {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = factory();
  cache.set(key, value, ttlMs);
  return value;
}

/**
 * Async version of getOrSet for async factory functions
 */
export async function getOrSetAsync<T>(
  key: string,
  factory: () => Promise<T>,
  ttlMs: number = TTL.MEDIUM
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await factory();
  cache.set(key, value, ttlMs);
  return value;
}

export { MemoryCache };
